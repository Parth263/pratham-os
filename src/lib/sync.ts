"use client"

/**
 * Keeps the in-browser store and the database in step.
 *
 * - The store (and its localStorage cache) is what the UI reads, so the app is instant and works offline.
 * - Every change is diffed against the previous state; only changed items go into an outbox,
 *   which survives reloads and is sent to /api/data shortly after you stop editing.
 * - The database is pulled when the tab comes back into view and every 30s, so the phone and
 *   laptop stay in step. A pull never overwrites edits that haven't been sent yet.
 */

import { create } from "zustand"
import { KEYED_COLLECTIONS, LIST_COLLECTIONS, SINGLE_KEYS, type Collection, type RecordRow, type SingleKey, type SyncPayload } from "./collections"
import { emptyData, migrateData } from "./seed"
import { snapshot, useApp } from "./store"
import type { AppData } from "./types"

export type SyncMode = "starting" | "synced" | "saving" | "offline" | "local" | "error"

export const useSync = create<{ mode: SyncMode; lastSyncedAt: number | null }>(() => ({ mode: "starting", lastSyncedAt: null }))

type Op = { kind: "upsert"; row: RecordRow } | { kind: "delete"; collection: Collection; id: string }

const OUTBOX_KEY = "studio-os:outbox"
const SYNCED_KEY = "studio-os:synced-once"
const MAX_BATCH = 2000

let outbox = new Map<string, Op>()
let applyingRemote = false
let flushing = false
let flushTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 2000
let changeCounter = 0
let lastSignature = ""
let startPromise: Promise<void> | null = null

const keyOf = (collection: string, id: string) => `${collection}\u0000${id}`
const setMode = (mode: SyncMode) => useSync.setState(mode === "synced" ? { mode, lastSyncedAt: Date.now() } : { mode })

// ---------------------------------------------------------------- shape conversion

function singleData(state: AppData, key: SingleKey): Record<string, unknown> {
  if (key === "meta") return { seeded: state.seeded, version: state.version }
  return state[key] as unknown as Record<string, unknown>
}

/** Every item as a database row. */
export function toRows(state: AppData): RecordRow[] {
  const rows: RecordRow[] = []
  for (const c of LIST_COLLECTIONS) for (const item of state[c] as { id: string }[]) rows.push({ collection: c, id: item.id, data: item })
  for (const c of KEYED_COLLECTIONS) for (const [id, data] of Object.entries(state[c])) rows.push({ collection: c, id, data })
  for (const k of SINGLE_KEYS) rows.push({ collection: "single", id: k, data: singleData(state, k) })
  return rows
}

/** What changed between two states. Unchanged items keep their object identity, so this is cheap. */
export function diffState(prev: AppData, next: AppData): Op[] {
  const ops: Op[] = []
  for (const c of LIST_COLLECTIONS) {
    const a = prev[c] as { id: string }[]
    const b = next[c] as { id: string }[]
    if (a === b) continue
    const before = new Map(a.map((i) => [i.id, i]))
    for (const item of b) {
      if (before.get(item.id) !== item) ops.push({ kind: "upsert", row: { collection: c, id: item.id, data: item } })
      before.delete(item.id)
    }
    for (const id of before.keys()) ops.push({ kind: "delete", collection: c, id })
  }
  for (const c of KEYED_COLLECTIONS) {
    const a = prev[c] as Record<string, unknown>
    const b = next[c] as Record<string, unknown>
    if (a === b) continue
    for (const [id, data] of Object.entries(b)) if (a[id] !== data) ops.push({ kind: "upsert", row: { collection: c, id, data } })
    for (const id of Object.keys(a)) if (!(id in b)) ops.push({ kind: "delete", collection: c, id })
  }
  for (const k of SINGLE_KEYS) {
    const changed = k === "meta" ? prev.seeded !== next.seeded || prev.version !== next.version : prev[k] !== next[k]
    if (changed) ops.push({ kind: "upsert", row: { collection: "single", id: k, data: singleData(next, k) } })
  }
  return ops
}

/** Rebuilds the app's data from database rows. */
export function fromRows(rows: RecordRow[]): AppData {
  const data = emptyData() as unknown as Record<string, unknown>
  const lists: Record<string, { id: string; createdAt?: string }[]> = {}
  const isList = (c: string): c is (typeof LIST_COLLECTIONS)[number] => (LIST_COLLECTIONS as readonly string[]).includes(c)
  const isKeyed = (c: string): c is (typeof KEYED_COLLECTIONS)[number] => (KEYED_COLLECTIONS as readonly string[]).includes(c)
  for (const r of rows) {
    if (isList(r.collection)) (lists[r.collection] ??= []).push(r.data as { id: string })
    else if (isKeyed(r.collection)) (data[r.collection] as Record<string, unknown>)[r.id] = r.data
    else if (r.collection === "single") {
      if (r.id === "meta") Object.assign(data, r.data as object)
      else data[r.id] = r.data
    }
  }
  for (const c of LIST_COLLECTIONS) {
    data[c] = (lists[c] ?? []).sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.id.localeCompare(b.id))
  }
  return migrateData(data)
}

/** Fingerprint of the database: changes whenever any row is added, edited or removed. */
export function signature(rows: { collection: string; id: string; updatedAt?: string }[]): string {
  const keys = rows.map((r) => `${r.collection}\u0000${r.id}\u0000${r.updatedAt ?? ""}`).sort()
  let h = 0x811c9dc5 // FNV-1a
  for (const k of keys) {
    for (let i = 0; i < k.length; i++) {
      h ^= k.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    h ^= 0x0a
  }
  return `${rows.length}:${(h >>> 0).toString(36)}`
}

// ---------------------------------------------------------------- outbox

function saveOutbox() {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify([...outbox.values()]))
  } catch {
    // storage full or blocked: the in-memory outbox still syncs this session
  }
}

function loadOutbox() {
  try {
    const ops = JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]") as Op[]
    outbox = new Map(ops.map((op) => [op.kind === "upsert" ? keyOf(op.row.collection, op.row.id) : keyOf(op.collection, op.id), op]))
  } catch {
    outbox = new Map()
  }
}

function enqueue(ops: Op[]) {
  for (const op of ops) outbox.set(op.kind === "upsert" ? keyOf(op.row.collection, op.row.id) : keyOf(op.collection, op.id), op)
  saveOutbox()
}

function payloadOf(ops: Op[]): SyncPayload {
  const payload: SyncPayload = { upserts: [], deletes: [] }
  for (const op of ops) {
    if (op.kind === "upsert") payload.upserts.push(op.row)
    else payload.deletes.push({ collection: op.collection, id: op.id })
  }
  return payload
}

function toLogin() {
  // A full page load on purpose: the session cookie is checked on the server.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`
}

function scheduleFlush(ms: number) {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => void flush(), ms)
}

async function flush(): Promise<void> {
  if (flushing || outbox.size === 0 || useSync.getState().mode === "local") return
  flushing = true
  const batch = [...outbox.entries()].slice(0, MAX_BATCH)
  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadOf(batch.map(([, op]) => op))),
    })
    if (res.status === 401) return toLogin()
    if (res.status === 503) return setMode("local")
    if (!res.ok) throw new Error(`Sync failed (${res.status})`)
    for (const [k, op] of batch) if (outbox.get(k) === op) outbox.delete(k)
    saveOutbox()
    retryDelay = 2000
    localStorage.setItem(SYNCED_KEY, "1")
    setMode(outbox.size ? "saving" : "synced")
  } catch {
    setMode("offline")
    scheduleFlush(retryDelay)
    retryDelay = Math.min(retryDelay * 2, 30_000)
    return
  } finally {
    flushing = false
  }
  if (outbox.size) scheduleFlush(250)
}

/** Fetches the database and applies it, unless there are local edits still on their way. */
export async function pull(): Promise<void> {
  if (useSync.getState().mode === "local") return
  if (outbox.size || flushing) return void flush()
  const counter = changeCounter
  let res: Response
  try {
    res = await fetch("/api/data", { cache: "no-store" })
  } catch {
    return setMode("offline")
  }
  if (res.status === 401) return toLogin()
  if (!res.ok) return
  const { records } = (await res.json()) as { records: (RecordRow & { updatedAt: string })[] }
  const sig = signature(records)
  if (sig !== lastSignature && counter === changeCounter && outbox.size === 0) {
    lastSignature = sig
    applyRemote(fromRows(records))
  }
  setMode("synced")
}

function applyRemote(data: AppData) {
  applyingRemote = true
  try {
    useApp.setState(data)
  } finally {
    applyingRemote = false
  }
}

async function initialLoad() {
  let res: Response
  try {
    res = await fetch("/api/data", { cache: "no-store" })
  } catch {
    setMode("offline")
    scheduleFlush(retryDelay)
    return
  }
  if (res.status === 401) return toLogin()
  if (res.status === 503) return setMode("local")
  if (!res.ok) return setMode("error")

  const { records } = (await res.json()) as { records: (RecordRow & { updatedAt: string })[] }
  if (records.length === 0) {
    // A fresh database: what's on this device becomes the starting point.
    enqueue(toRows(snapshot()).map((row) => ({ kind: "upsert", row })))
    setMode("saving")
    return flush()
  }
  if (outbox.size) {
    // Edits made offline go up first, then we take the merged result.
    await flush()
    return pull()
  }
  lastSignature = signature(records)
  applyRemote(fromRows(records))
  localStorage.setItem(SYNCED_KEY, "1")
  setMode("synced")
  // The meta row records the data version for future migrations; make sure it exists.
  if (!records.some((r) => r.collection === "single" && r.id === "meta")) {
    const state = snapshot()
    enqueue([{ kind: "upsert", row: { collection: "single", id: "meta", data: singleData(state, "meta") } }])
    scheduleFlush(100)
  }
}

/** True once this browser has synced at least once, so it can show its cache straight away. */
export function hasSyncedBefore(): boolean {
  try {
    return localStorage.getItem(SYNCED_KEY) === "1"
  } catch {
    return false
  }
}

export function startSync(): Promise<void> {
  if (startPromise) return startPromise
  loadOutbox()
  useApp.subscribe((state, prev) => {
    if (applyingRemote) return
    const ops = diffState(prev, state)
    if (!ops.length) return
    changeCounter++
    enqueue(ops)
    const mode = useSync.getState().mode
    if (mode === "local" || mode === "starting") return
    if (mode !== "offline") setMode("saving")
    scheduleFlush(400)
  })

  const onVisible = () => {
    if (document.visibilityState === "visible") void pull()
  }
  document.addEventListener("visibilitychange", onVisible)
  window.addEventListener("online", () => void (outbox.size ? flush() : pull()))
  window.addEventListener("pagehide", () => {
    // Last chance to send small pending edits; anything left stays in the outbox for next time.
    if (!outbox.size || useSync.getState().mode === "local") return
    const body = JSON.stringify(payloadOf([...outbox.values()]))
    if (body.length < 60_000) void fetch("/api/data", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true })
  })
  setInterval(() => {
    if (document.visibilityState === "visible") void pull()
  }, 30_000)

  startPromise = initialLoad()
  return startPromise
}

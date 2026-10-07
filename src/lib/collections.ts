/**
 * How the app's data maps onto database rows. Shared by the client sync and the API.
 *
 * - list:   arrays of items with an `id` → one row per item
 * - keyed:  records keyed by day → one row per day
 * - single: one-off objects → one row each, id = the key name
 */
export const LIST_COLLECTIONS = [
  "pillars",
  "rhythm",
  "posts",
  "audience",
  "prompts",
  "proof",
  "swipe",
  "leads",
  "touches",
  "make",
  "revenue",
  "reviews",
] as const

export const KEYED_COLLECTIONS = ["dayLogs", "weeklyGoals"] as const

export const SINGLE_KEYS = ["settings", "playbook", "idealClients", "meta"] as const

export type ListCollection = (typeof LIST_COLLECTIONS)[number]
export type KeyedCollection = (typeof KEYED_COLLECTIONS)[number]
export type SingleKey = (typeof SINGLE_KEYS)[number]

/** Every value allowed in the `collection` column. */
export const ALL_COLLECTIONS = [...LIST_COLLECTIONS, ...KEYED_COLLECTIONS, "single"] as const
export type Collection = (typeof ALL_COLLECTIONS)[number]

export interface RecordRow {
  collection: Collection
  id: string
  data: unknown
}

export interface SyncPayload {
  upserts: RecordRow[]
  deletes: { collection: Collection; id: string }[]
}

"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addDaysTo, todayIST, weekStartOf } from "./dates"
import { afterStageChange, afterTouch } from "./pipeline"
import { blankLead, blankPost, emptyData, seedData, uid } from "./seed"
import { pickSlot } from "./slots"
import type {
  AppData,
  AudienceLine,
  Day,
  Lead,
  LeadStage,
  MakeItem,
  Playbook,
  Post,
  Prompt,
  Proof,
  Revenue,
  RhythmSlot,
  Segment,
  Settings,
  SwipeItem,
  WeeklyReview,
} from "./types"

type Listy = "audience" | "prompts" | "proof" | "swipe" | "make" | "revenue"
type ItemOf<K extends Listy> = AppData[K][number]

interface Actions {
  seedIfEmpty: () => void
  updateSettings: (patch: Partial<Settings>) => void
  updatePlaybook: (patch: Partial<Playbook>) => void
  setRhythm: (rhythm: RhythmSlot[]) => void

  savePost: (post: Post) => void
  addIdea: (text: string, pillar: Post["pillar"]) => void
  markPosted: (id: string) => void
  deletePost: (id: string) => void

  addItem: <K extends Listy>(key: K, item: Omit<ItemOf<K>, "id" | "createdAt" | "updatedAt">) => string
  updateItem: <K extends Listy>(key: K, id: string, patch: Partial<ItemOf<K>>) => void
  removeItem: (key: Listy, id: string) => void
  setIdealClient: (segment: "agency" | "ai_startup", text: string) => void

  saveLead: (lead: Lead) => void
  deleteLead: (id: string) => void
  setLeadStage: (id: string, stage: LeadStage) => void
  touchLead: (id: string) => void
  addQuickDm: (segment: Segment | null) => string
  removeTouch: (id: string) => void

  toggleFocus: (date: Day) => void
  setFocusRef: (date: Day, ref: string | null) => void
  setWeekGoal: (weekStart: Day, title: string) => void
  toggleWeekGoalDone: (weekStart: Day) => void
  toggleWeekCheck: (weekStart: Day, key: string) => void
  saveReview: (review: Omit<WeeklyReview, "id" | "createdAt" | "updatedAt">) => void

  removeSamples: () => void
  importData: (data: AppData) => void
  resetAll: () => void
}

export type AppState = AppData & Actions

const now = () => new Date().toISOString()

function weekGoal(state: AppData, weekStart: Day) {
  return state.weeklyGoals[weekStart] ?? { weekStart, title: "", done: false, checks: [] }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyData(),

      seedIfEmpty: () => {
        if (!get().seeded) set(seedData(todayIST()))
      },
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updatePlaybook: (patch) => set((s) => ({ playbook: { ...s.playbook, ...patch } })),
      setRhythm: (rhythm) => set({ rhythm }),

      savePost: (post) =>
        set((s) => {
          const prev = s.posts.find((p) => p.id === post.id)
          const next: Post = { ...post, updatedAt: now() }
          if (!next.date) next.slotIndex = null
          else {
            // No slot chosen, or the chosen one is taken: place it automatically.
            const clash = s.posts.some((p) => p.id !== next.id && p.date === next.date && p.slotIndex === next.slotIndex)
            if (next.slotIndex === null || clash) next.slotIndex = pickSlot(next.date, next.pillar, s, next.id)
          }
          if (next.status === "posted" && !next.postedAt) next.postedAt = now()
          if (next.status !== "posted") next.postedAt = null
          return { posts: prev ? s.posts.map((p) => (p.id === next.id ? next : p)) : [...s.posts, next] }
        }),
      addIdea: (text, pillar) =>
        set((s) => ({ posts: [...s.posts, blankPost({ xText: text, angle: "", pillar, status: "idea" })] })),
      markPosted: (id) =>
        set((s) => ({
          posts: s.posts.map((p) => (p.id === id ? { ...p, status: "posted", postedAt: p.postedAt ?? now(), updatedAt: now() } : p)),
        })),
      deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      addItem: (key, item) => {
        const id = uid()
        set((s) => ({ [key]: [...(s[key] as ItemOf<typeof key>[]), { ...item, id, createdAt: now(), updatedAt: now() }] }) as Partial<AppData>)
        return id
      },
      updateItem: (key, id, patch) =>
        set(
          (s) =>
            ({
              [key]: (s[key] as ItemOf<typeof key>[]).map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now() } : i)),
            }) as Partial<AppData>,
        ),
      removeItem: (key, id) => set((s) => ({ [key]: (s[key] as { id: string }[]).filter((i) => i.id !== id) }) as Partial<AppData>),
      setIdealClient: (segment, text) => set((s) => ({ idealClients: { ...s.idealClients, [segment]: text } })),

      saveLead: (lead) =>
        set((s) => {
          const exists = s.leads.some((l) => l.id === lead.id)
          const next = { ...lead, updatedAt: now() }
          return { leads: exists ? s.leads.map((l) => (l.id === lead.id ? next : l)) : [...s.leads, next] }
        }),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id), touches: s.touches.filter((t) => t.leadId !== id) })),
      setLeadStage: (id, stage) =>
        set((s) => {
          const today = todayIST()
          const lead = s.leads.find((l) => l.id === id)
          if (!lead) return {}
          const patch = afterStageChange(lead, stage, today)
          const revenue: Revenue[] =
            stage === "won" && lead.stage !== "won" && lead.dealValueUsd
              ? [...s.revenue, { id: uid(), createdAt: now(), updatedAt: now(), date: today, amountUsd: lead.dealValueUsd, note: lead.company || lead.name }]
              : s.revenue
          return { leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l)), revenue }
        }),
      touchLead: (id) =>
        set((s) => {
          const today = todayIST()
          const lead = s.leads.find((l) => l.id === id)
          if (!lead) return {}
          const count = s.touches.filter((t) => t.leadId === id).length + 1
          const patch = afterTouch(lead, count, today)
          return {
            touches: [...s.touches, { id: uid(), createdAt: now(), updatedAt: now(), leadId: id, date: today, channel: lead.channel, segment: lead.segment }],
            leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l)),
          }
        }),
      addQuickDm: (segment) => {
        const id = uid()
        set((s) => ({ touches: [...s.touches, { id, createdAt: now(), updatedAt: now(), leadId: null, date: todayIST(), channel: "x", segment }] }))
        return id
      },
      removeTouch: (id) => set((s) => ({ touches: s.touches.filter((t) => t.id !== id) })),

      toggleFocus: (date) =>
        set((s) => {
          const log = s.dayLogs[date] ?? { date, focusDone: false, focusRef: null }
          return { dayLogs: { ...s.dayLogs, [date]: { ...log, focusDone: !log.focusDone } } }
        }),
      setFocusRef: (date, ref) =>
        set((s) => {
          const log = s.dayLogs[date] ?? { date, focusDone: false, focusRef: null }
          return { dayLogs: { ...s.dayLogs, [date]: { ...log, focusRef: ref, focusDone: false } } }
        }),
      setWeekGoal: (weekStart, title) =>
        set((s) => ({ weeklyGoals: { ...s.weeklyGoals, [weekStart]: { ...weekGoal(s, weekStart), title } } })),
      toggleWeekGoalDone: (weekStart) =>
        set((s) => {
          const g = weekGoal(s, weekStart)
          return { weeklyGoals: { ...s.weeklyGoals, [weekStart]: { ...g, done: !g.done } } }
        }),
      toggleWeekCheck: (weekStart, key) =>
        set((s) => {
          const g = weekGoal(s, weekStart)
          const checks = g.checks.includes(key) ? g.checks.filter((k) => k !== key) : [...g.checks, key]
          return { weeklyGoals: { ...s.weeklyGoals, [weekStart]: { ...g, checks } } }
        }),
      saveReview: (review) =>
        set((s) => {
          const nextWeek = addDaysTo(review.weekStart, 7)
          const thisGoal = weekGoal(s, review.weekStart)
          const reviews = [
            ...s.reviews.filter((r) => r.weekStart !== review.weekStart),
            { ...review, id: uid(), createdAt: now(), updatedAt: now() },
          ]
          const weeklyGoals = {
            ...s.weeklyGoals,
            [review.weekStart]: { ...thisGoal, checks: Array.from(new Set([...thisGoal.checks, "review"])) },
          }
          if (review.nextGoal.trim()) weeklyGoals[nextWeek] = { ...weekGoal(s, nextWeek), title: review.nextGoal.trim() }
          return { reviews, weeklyGoals }
        }),

      removeSamples: () =>
        set((s) => {
          const sampleLeads = new Set(s.leads.filter((l) => l.isSample).map((l) => l.id))
          return {
            posts: s.posts.filter((p) => !p.isSample),
            leads: s.leads.filter((l) => !l.isSample),
            touches: s.touches.filter((t) => !t.leadId || !sampleLeads.has(t.leadId)),
          }
        }),
      importData: (data) => set({ ...emptyData(), ...data, seeded: true }),
      resetAll: () => set(seedData(todayIST())),
    }),
    {
      name: "studio-os",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        const data: Partial<AppState> = { ...s }
        for (const k of Object.keys(data) as (keyof AppState)[]) if (typeof data[k] === "function") delete data[k]
        return data as AppData
      },
    },
  ),
)

/** The plain data, for export. */
export function snapshot(): AppData {
  const s = useApp.getState()
  const keys = Object.keys(emptyData()) as (keyof AppData)[]
  return Object.fromEntries(keys.map((k) => [k, s[k]])) as unknown as AppData
}

export { blankLead, blankPost, uid }
export type { AudienceLine, MakeItem, Prompt, Proof, SwipeItem, Revenue }

export const thisWeek = () => weekStartOf(todayIST())

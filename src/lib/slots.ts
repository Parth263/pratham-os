import { addDaysTo, daysBetween, monthEndOf, monthStartOf, weekdayOf } from "./dates"
import type { Day, Pillar, Post, PostStatus, RhythmSlot, Settings } from "./types"

export type SlotState = "filled" | "open" | "missed"

export interface Slot {
  date: Day
  slotIndex: number
  pillar: Pillar
  post: Post | null
  state: SlotState
}

export interface SlotContext {
  rhythm: RhythmSlot[]
  posts: Post[]
  settings: Pick<Settings, "runStart" | "runEnd">
  today: Day
}

export function inRun(d: Day, settings: Pick<Settings, "runStart" | "runEnd">): boolean {
  return d >= settings.runStart && d <= settings.runEnd
}

/** The rhythm's slots for a day. Slots only exist inside the run. */
export function rhythmForDay(d: Day, ctx: Pick<SlotContext, "rhythm" | "settings">): RhythmSlot[] {
  if (!inRun(d, ctx.settings)) return []
  const wd = weekdayOf(d)
  return ctx.rhythm.filter((r) => r.weekday === wd).sort((a, b) => a.slotIndex - b.slotIndex)
}

export function postsByDate(posts: Post[]): Map<Day, Post[]> {
  const map = new Map<Day, Post[]>()
  for (const p of posts) {
    if (!p.date) continue
    const list = map.get(p.date)
    if (list) list.push(p)
    else map.set(p.date, [p])
  }
  return map
}

export function slotsForDay(d: Day, ctx: SlotContext, byDate = postsByDate(ctx.posts)): Slot[] {
  const dayPosts = byDate.get(d) ?? []
  return rhythmForDay(d, ctx).map((r) => {
    const post = dayPosts.find((p) => p.slotIndex === r.slotIndex) ?? null
    const state: SlotState = post ? "filled" : d >= ctx.today ? "open" : "missed"
    return { date: d, slotIndex: r.slotIndex, pillar: r.pillar, post, state }
  })
}

/** Posts on a day that don't sit in one of its rhythm slots. Shown, never counted. */
export function extrasForDay(d: Day, ctx: SlotContext, byDate = postsByDate(ctx.posts)): Post[] {
  const indexes = new Set(rhythmForDay(d, ctx).map((r) => r.slotIndex))
  return (byDate.get(d) ?? []).filter((p) => p.slotIndex === null || !indexes.has(p.slotIndex))
}

export function slotsInRange(from: Day, to: Day, ctx: SlotContext): Slot[] {
  const byDate = postsByDate(ctx.posts)
  return daysBetween(from, to).flatMap((d) => slotsForDay(d, ctx, byDate))
}

export interface RangeStats {
  total: number
  filled: number
  byStatus: Record<PostStatus, number>
  /** open slots from today to the end of the range */
  open: number
  perPillar: Record<Pillar, { filled: number; total: number }>
  noPillar: number
}

export function monthStats(anyDay: Day, ctx: SlotContext): RangeStats {
  return rangeStats(monthStartOf(anyDay), monthEndOf(anyDay), ctx)
}

export function rangeStats(from: Day, to: Day, ctx: SlotContext): RangeStats {
  const slots = slotsInRange(from, to, ctx)
  const byStatus: Record<PostStatus, number> = { idea: 0, draft: 0, ready: 0, posted: 0 }
  const perPillar: RangeStats["perPillar"] = {}
  let filled = 0
  let open = 0
  for (const s of slots) {
    perPillar[s.pillar] ??= { filled: 0, total: 0 }
    perPillar[s.pillar].total++
    if (s.post) {
      filled++
      byStatus[s.post.status]++
      perPillar[s.pillar].filled++
    } else if (s.state === "open") {
      open++
    }
  }
  const noPillar = ctx.posts.filter((p) => p.date && p.date >= from && p.date <= to && !p.pillar).length
  return { total: slots.length, filled, byStatus, open, perPillar, noPillar }
}

/**
 * Where a dated post goes: that day's first free slot with the same pillar,
 * then any free slot, else null (an "extra" post).
 */
export function pickSlot(
  date: Day,
  pillar: Pillar | null,
  ctx: Pick<SlotContext, "rhythm" | "settings" | "posts">,
  excludeId?: string,
): number | null {
  const taken = new Set(
    ctx.posts.filter((p) => p.date === date && p.id !== excludeId && p.slotIndex !== null).map((p) => p.slotIndex),
  )
  const free = rhythmForDay(date, ctx).filter((r) => !taken.has(r.slotIndex))
  return (free.find((r) => r.pillar === pillar) ?? free[0])?.slotIndex ?? null
}

/** "1 to publish today · 9 to write in the next 2 weeks" */
export function workload(ctx: SlotContext) {
  const byDate = postsByDate(ctx.posts)
  const todaySlots = slotsForDay(ctx.today, ctx, byDate)
  const todayExtras = extrasForDay(ctx.today, ctx, byDate)
  const toPublish =
    todaySlots.filter((s) => s.post?.status !== "posted").length +
    todayExtras.filter((p) => p.status !== "posted").length

  const end = addDaysTo(ctx.today, 13)
  const openSlots = daysBetween(ctx.today, end)
    .flatMap((d) => slotsForDay(d, ctx, byDate))
    .filter((s) => s.state === "open").length
  const unfinished = ctx.posts.filter(
    (p) => p.date && p.date >= ctx.today && p.date <= end && (p.status === "idea" || p.status === "draft"),
  ).length
  return { toPublish, toWrite: openSlots + unfinished }
}

/** Upcoming open slots, grouped by day. */
export function upcomingOpenSlots(ctx: SlotContext, days = 60): { date: Day; slots: Slot[] }[] {
  const byDate = postsByDate(ctx.posts)
  const out: { date: Day; slots: Slot[] }[] = []
  for (const d of daysBetween(ctx.today, addDaysTo(ctx.today, days - 1))) {
    const open = slotsForDay(d, ctx, byDate).filter((s) => s.state === "open")
    if (open.length) out.push({ date: d, slots: open })
  }
  return out
}

/** Every slot that day has a posted post. Days without slots count as done. */
export function dayPublished(d: Day, ctx: SlotContext, byDate = postsByDate(ctx.posts)): boolean {
  const slots = slotsForDay(d, ctx, byDate)
  if (slots.length === 0) return true
  return slots.every((s) => s.post?.status === "posted")
}

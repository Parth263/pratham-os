import { addDaysTo, daysBetween, weekdayOf } from "./dates"
import { dayPublished, postsByDate, slotsForDay, type SlotContext } from "./slots"
import type { Day, DayLog, Touch } from "./types"

export function dmCount(d: Day, touches: Touch[]): number {
  return touches.filter((t) => t.date === d).length
}

/**
 * Count back from today. Today only adds once it's done, and never breaks a streak.
 * `skip` days (weekends for DMs) neither count nor break it.
 */
function streak(today: Day, floor: Day, done: (d: Day) => boolean, skip: (d: Day) => boolean = () => false) {
  let n = done(today) ? 1 : 0
  for (let d = addDaysTo(today, -1); d >= floor; d = addDaysTo(d, -1)) {
    if (done(d)) n++
    else if (!skip(d)) break
  }
  return n
}

const isWeekend = (d: Day) => weekdayOf(d) >= 5

export function dmStreak(today: Day, touches: Touch[], target: number, runStart: Day): number {
  const counts = new Map<Day, number>()
  for (const t of touches) counts.set(t.date, (counts.get(t.date) ?? 0) + 1)
  return streak(today, runStart, (d) => (counts.get(d) ?? 0) >= target, isWeekend)
}

export function postStreak(ctx: SlotContext): number {
  const byDate = postsByDate(ctx.posts)
  return streak(
    ctx.today,
    ctx.settings.runStart,
    (d) => slotsForDay(d, ctx, byDate).length > 0 && dayPublished(d, ctx, byDate),
    (d) => slotsForDay(d, ctx, byDate).length === 0,
  )
}

export function focusStreak(today: Day, dayLogs: Record<Day, DayLog>, runStart: Day): number {
  return streak(today, runStart, (d) => dayLogs[d]?.focusDone === true)
}

/** Today's three, scored across a Mon–Sun week: done items ÷ 21. */
export function threeScore(
  weekStart: Day,
  ctx: SlotContext & { touches: Touch[]; dayLogs: Record<Day, DayLog>; dmTarget: number },
): { done: number; total: number } {
  const byDate = postsByDate(ctx.posts)
  let done = 0
  for (const d of daysBetween(weekStart, addDaysTo(weekStart, 6))) {
    if (dmCount(d, ctx.touches) >= ctx.dmTarget) done++
    if (dayPublished(d, ctx, byDate)) done++
    if (ctx.dayLogs[d]?.focusDone) done++
  }
  return { done, total: 21 }
}

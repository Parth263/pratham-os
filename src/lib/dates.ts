import { TZDate } from "@date-fns/tz"
import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO } from "date-fns"
import type { Day, Settings } from "./types"

/** Every day, week and streak is counted in India time. */
export const TZ = "Asia/Kolkata"

export function todayIST(now: Date = new Date()): Day {
  return format(new TZDate(now, TZ), "yyyy-MM-dd")
}

export function hourIST(now: Date = new Date()): number {
  return new TZDate(now, TZ).getHours()
}

/*
 * Below, days are plain "yyyy-MM-dd" strings. Parsing one gives local midnight,
 * which is only used for calendar arithmetic, so the device timezone never leaks in.
 */

export function addDaysTo(d: Day, n: number): Day {
  return format(addDays(parseISO(d), n), "yyyy-MM-dd")
}

/** a − b in whole days */
export function diffDays(a: Day, b: Day): number {
  return differenceInCalendarDays(parseISO(a), parseISO(b))
}

/** 0 = Monday … 6 = Sunday */
export function weekdayOf(d: Day): number {
  return (parseISO(d).getDay() + 6) % 7
}

export function weekStartOf(d: Day): Day {
  return addDaysTo(d, -weekdayOf(d))
}

export function monthStartOf(d: Day): Day {
  return `${d.slice(0, 7)}-01`
}

export function monthEndOf(d: Day): Day {
  return format(endOfMonth(parseISO(d)), "yyyy-MM-dd")
}

export function addMonthsTo(d: Day, n: number): Day {
  const date = parseISO(monthStartOf(d))
  date.setMonth(date.getMonth() + n)
  return format(date, "yyyy-MM-dd")
}

/** Inclusive list of days from `from` to `to`. */
export function daysBetween(from: Day, to: Day): Day[] {
  const out: Day[] = []
  for (let d = from; d <= to; d = addDaysTo(d, 1)) out.push(d)
  return out
}

export function fmt(d: Day, pattern: string): string {
  return format(parseISO(d), pattern)
}

export function greeting(hour: number): string {
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

/** Day N of the run. Day 1 is runStart. */
export function runDay(today: Day, settings: Pick<Settings, "runStart" | "runEnd">) {
  const total = diffDays(settings.runEnd, settings.runStart) + 1
  const day = Math.min(Math.max(diffDays(today, settings.runStart) + 1, 0), total)
  return { day, total, left: total - day }
}

/** Days left in the Mon–Sun week, counting today. */
export function daysLeftInWeek(today: Day): number {
  return 7 - weekdayOf(today)
}

/** "Today", "Tomorrow", "Yesterday" or "Wed 8". */
export function relativeDay(d: Day, today: Day): string {
  const diff = diffDays(d, today)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  return fmt(d, "EEE d")
}

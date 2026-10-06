"use client"

import { CalendarCheckIcon, CalendarPlusIcon, ChevronLeftIcon, ChevronRightIcon, ChevronRightIcon as RowArrow } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Chip, firstLine, Panel, PanelHeader, PillarMark, Row, STATUS_FILL, StatusPill } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { addDaysTo, addMonthsTo, daysBetween, fmt, monthEndOf, monthStartOf, weekStartOf } from "@/lib/dates"
import { PILLAR_LABEL, PILLARS, STATUS_LABEL, WEEKDAY_SHORT } from "@/lib/labels"
import { extrasForDay, postsByDate, rangeStats, slotsForDay, type Slot, type SlotContext } from "@/lib/slots"
import { useApp } from "@/lib/store"
import type { Day, Post } from "@/lib/types"
import { useMediaQuery, useToday, useUi } from "@/lib/ui"
import { cn } from "@/lib/utils"

type View = "week" | "month"

export function CalendarView({ view: viewParam, at }: { view: View | null; at: Day | null }) {
  const router = useRouter()
  const { today } = useToday()
  const desktop = useMediaQuery("(min-width: 768px)")
  const posts = useApp((s) => s.posts)
  const rhythm = useApp((s) => s.rhythm)
  const settings = useApp((s) => s.settings)
  const view: View = viewParam ?? "month"
  const anchor = at && /^\d{4}-\d{2}-\d{2}$/.test(at) ? at : today

  const ctx: SlotContext = useMemo(() => ({ rhythm, posts, settings, today }), [rhythm, posts, settings, today])
  const from = view === "month" ? monthStartOf(anchor) : weekStartOf(anchor)
  const to = view === "month" ? monthEndOf(anchor) : addDaysTo(from, 6)
  const stats = useMemo(() => rangeStats(from, to, ctx), [from, to, ctx])

  const go = (nextView: View, nextAt: Day) => router.replace(`/calendar?view=${nextView}&at=${nextAt}`, { scroll: false })
  const step = (dir: 1 | -1) => go(view, view === "month" ? addMonthsTo(anchor, dir) : addDaysTo(from, dir * 7))
  const isCurrent = today >= from && today <= to

  const title = view === "month" ? fmt(from, "MMMM yyyy") : `${fmt(from, "d MMM")} – ${fmt(to, from.slice(0, 7) === to.slice(0, 7) ? "d" : "d MMM")}`
  const relative =
    view === "month"
      ? isCurrent
        ? "This month"
        : null
      : isCurrent
        ? "This week"
        : from === addDaysTo(weekStartOf(today), 7)
          ? "Next week"
          : null

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex gap-1.5">
            <Chip>{view === "month" ? fmt(from, "MMMM yyyy") : `Week of ${fmt(from, "d MMMM")}`}</Chip>
            {relative ? (
              <Chip>{relative}</Chip>
            ) : (
              <button type="button" onClick={() => go(view, today)}>
                <Chip className="hover:text-foreground">Back to today</Chip>
              </button>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium">
            {stats.open} open {stats.open === 1 ? "slot" : "slots"}
          </span>
          <ToggleGroup type="single" size="sm" variant="outline" spacing={0} value={view} onValueChange={(v) => v && go(v as View, anchor)}>
            <ToggleGroupItem value="week" className="h-7 px-3 text-xs">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="month" className="h-7 px-3 text-xs">
              Month
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex">
            <Button variant="outline" size="icon-sm" className="rounded-r-none" aria-label="Previous" onClick={() => step(-1)}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" size="icon-sm" className="-ml-px rounded-l-none" aria-label="Next" onClick={() => step(1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SlotsFilled stats={stats} label={view === "month" ? "this month" : "this week"} />
        <OpenSlots ctx={ctx} from={from} to={to} />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
        {PILLARS.map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5">
            <PillarMark pillar={p} />
            {PILLAR_LABEL[p]}
            <span className="tabular-nums text-foreground">
              {stats.perPillar[p].filled}
              <span className="text-muted-foreground">/{stats.perPillar[p].total}</span>
            </span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <PillarMark pillar={null} />
          No pillar <span className="tabular-nums text-foreground">{stats.noPillar}</span>
        </span>
      </div>

      {view === "month" && desktop ? <MonthGrid ctx={ctx} from={from} to={to} /> : <DayList ctx={ctx} days={daysBetween(from, to)} />}
    </div>
  )
}

function SlotsFilled({ stats, label }: { stats: ReturnType<typeof rangeStats>; label: string }) {
  const pct = stats.total ? Math.round((stats.filled / stats.total) * 100) : 0
  return (
    <Panel>
      <PanelHeader icon={CalendarCheckIcon} title="Slots filled" meta={label} />
      <div className="flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight">
          {stats.filled}
          <span className="text-muted-foreground">/{stats.total}</span>
        </p>
        <p className="pb-1 text-xs text-muted-foreground">{pct}% of your rhythm</p>
      </div>
      {/* Segmented bar: one segment per status, 2px gaps, the rest is open track */}
      <div className="mt-3 flex h-6 gap-0.5 overflow-hidden rounded-md bg-status-open" role="img" aria-label={`${stats.filled} of ${stats.total} slots filled`}>
        {(["posted", "ready", "draft", "idea"] as const).map((st) =>
          stats.byStatus[st] && stats.total ? (
            <div key={st} className={cn(STATUS_FILL[st], "first:rounded-l-md")} style={{ width: `${(stats.byStatus[st] / stats.total) * 100}%` }} title={`${STATUS_LABEL[st]}: ${stats.byStatus[st]}`} />
          ) : null,
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        {(["posted", "ready", "draft", "idea"] as const).map((st) => (
          <div key={st} className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span className={cn("size-2 rounded-full", STATUS_FILL[st])} />
              {STATUS_LABEL[st]}
            </dt>
            <dd className="tabular-nums">{stats.byStatus[st]}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function OpenSlots({ ctx, from, to }: { ctx: SlotContext; from: Day; to: Day }) {
  const newPost = useUi((s) => s.newPost)
  const start = from > ctx.today ? from : ctx.today
  const byDate = postsByDate(ctx.posts)
  const days = start > to ? [] : daysBetween(start, to).map((d) => ({ date: d, slots: slotsForDay(d, ctx, byDate).filter((s) => s.state === "open") })).filter((d) => d.slots.length)
  const shown = days.slice(0, 4)
  const total = days.reduce((n, d) => n + d.slots.length, 0)

  return (
    <Panel>
      <PanelHeader icon={CalendarPlusIcon} title="Open slots" meta={`${total} to plan`} />
      {shown.length === 0 ? (
        <Row className="text-sm text-muted-foreground">{start > to ? "This stretch is in the past." : "Every slot here is filled. Lovely."}</Row>
      ) : (
        <div className="space-y-2">
          {shown.map((d) => (
            <button
              key={d.date}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg bg-row px-3 py-2.5 text-left transition-colors hover:bg-muted"
              onClick={() => newPost({ date: d.date, slotIndex: d.slots[0].slotIndex, pillar: d.slots[0].pillar })}
            >
              <span className="w-24 shrink-0 text-sm">{fmt(d.date, "EEE, MMM d")}</span>
              <span className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1">
                {d.slots.map((s) => (
                  <span key={s.slotIndex} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PillarMark pillar={s.pillar} open />
                    {PILLAR_LABEL[s.pillar]}
                  </span>
                ))}
              </span>
              <RowArrow className="size-4 text-muted-foreground" />
            </button>
          ))}
          {days.length > shown.length && <p className="px-1 pt-1 text-xs text-muted-foreground">+{days.length - shown.length} more days</p>}
        </div>
      )}
    </Panel>
  )
}

function SlotBars({ slots }: { slots: Slot[] }) {
  if (!slots.length) return null
  return (
    <div className="flex gap-1">
      {slots.map((s) => (
        <span
          key={s.slotIndex}
          className={cn("h-1 flex-1 rounded-full", s.post ? STATUS_FILL[s.post.status] : STATUS_FILL.open, s.state === "missed" && "opacity-60")}
        />
      ))}
    </div>
  )
}

function PostLine({ post, compact }: { post: Post; compact?: boolean }) {
  const openPost = useUi((s) => s.openPost)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        openPost(post.id)
      }}
      className={cn("flex w-full min-w-0 items-center gap-1.5 rounded-md text-left hover:bg-muted", compact ? "px-1 py-0.5 text-[11px]" : "px-1.5 py-1 text-sm")}
    >
      <PillarMark pillar={post.pillar} className={compact ? "size-3.5 rounded-[4px] text-[8px]" : undefined} />
      <span className={cn("min-w-0 flex-1 truncate", post.status === "posted" && "text-muted-foreground")}>{firstLine(post.xText || post.angle)}</span>
      {(post.status === "draft" || post.status === "idea") && <StatusPill status={post.status} className={compact ? "h-4 px-1 text-[9px]" : undefined} />}
    </button>
  )
}

function MonthGrid({ ctx, from, to }: { ctx: SlotContext; from: Day; to: Day }) {
  const newPost = useUi((s) => s.newPost)
  const gridStart = weekStartOf(from)
  const gridEnd = addDaysTo(weekStartOf(to), 6)
  const byDate = postsByDate(ctx.posts)
  const days = daysBetween(gridStart, gridEnd)

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="px-3 py-2 text-xs text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = d >= from && d <= to
          const slots = slotsForDay(d, ctx, byDate)
          const extras = extrasForDay(d, ctx, byDate)
          const dayPosts = [...slots.flatMap((s) => (s.post ? [s.post] : [])), ...extras]
          const open = slots.filter((s) => s.state === "open")
          const isToday = d === ctx.today
          return (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => newPost(open[0] ? { date: d, slotIndex: open[0].slotIndex, pillar: open[0].pillar } : { date: d })}
              onKeyDown={(e) => e.key === "Enter" && newPost({ date: d })}
              className={cn(
                "group flex min-h-28 flex-col gap-1 p-2 text-left transition-colors hover:bg-row",
                i % 7 !== 6 && "border-r",
                i < days.length - 7 && "border-b",
                !inMonth && "bg-row/60 text-muted-foreground",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    isToday ? "bg-primary font-medium text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {fmt(d, "d")}
                </span>
                <span className="flex gap-0.5">
                  {open.map((s) => (
                    <PillarMark key={s.slotIndex} pillar={s.pillar} open className="size-3.5 rounded-[4px] text-[8px]" />
                  ))}
                </span>
              </div>
              <div className="flex-1 space-y-0.5">
                {dayPosts.slice(0, 2).map((p) => (
                  <PostLine key={p.id} post={p} compact />
                ))}
                {dayPosts.length > 2 && <p className="px-1 text-[11px] text-muted-foreground">+{dayPosts.length - 2} more</p>}
              </div>
              <SlotBars slots={slots} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayList({ ctx, days }: { ctx: SlotContext; days: Day[] }) {
  const newPost = useUi((s) => s.newPost)
  const byDate = postsByDate(ctx.posts)
  return (
    <div className="space-y-3">
      {days.map((d) => {
        const slots = slotsForDay(d, ctx, byDate)
        const extras = extrasForDay(d, ctx, byDate)
        const isToday = d === ctx.today
        return (
          <section key={d} className={cn("rounded-xl border bg-card p-3", d < ctx.today && "opacity-80")}>
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="text-sm font-medium">{fmt(d, "EEEE d MMM")}</span>
              {isToday && <Chip className="h-5">Today</Chip>}
              <span className="ml-auto w-20">
                <SlotBars slots={slots} />
              </span>
            </div>
            <div className="space-y-1.5">
              {slots.map((s) =>
                s.post ? (
                  <Row key={s.slotIndex} className="p-1">
                    <PostLine post={s.post} />
                  </Row>
                ) : s.state === "open" ? (
                  <button
                    key={s.slotIndex}
                    type="button"
                    onClick={() => newPost({ date: d, slotIndex: s.slotIndex, pillar: s.pillar })}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed px-3 text-left text-sm text-muted-foreground hover:bg-row hover:text-foreground"
                  >
                    <PillarMark pillar={s.pillar} open />
                    {PILLAR_LABEL[s.pillar]} slot open
                    <span className="ml-auto text-xs">Write</span>
                  </button>
                ) : (
                  <Row key={s.slotIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PillarMark pillar={s.pillar} open />
                    {PILLAR_LABEL[s.pillar]} slot · skipped
                  </Row>
                ),
              )}
              {extras.map((p) => (
                <Row key={p.id} className="p-1">
                  <PostLine post={p} />
                </Row>
              ))}
              {slots.length === 0 && extras.length === 0 && (
                <button type="button" onClick={() => newPost({ date: d })} className="w-full px-1 py-1 text-left text-xs text-muted-foreground hover:text-foreground">
                  No slot. Add a post anyway
                </button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}


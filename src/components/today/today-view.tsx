"use client"

import {
  BookOpenIcon,
  CheckIcon,
  ListChecksIcon,
  PencilLineIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  TagIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CopyButton, textFor, type Platform } from "@/components/copy-button"
import { Arrow, Chip, firstLine, MutedLink, Panel, PanelHeader, PillarMark, Row, StatusPill } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { addDaysTo, daysLeftInWeek, fmt, greeting, runDay, weekdayOf, weekStartOf } from "@/lib/dates"
import { MAKE_KIND_LABEL, PILLAR_LABEL, PILLARS, SEGMENT_LABEL, SEGMENTS } from "@/lib/labels"
import { isDue, pickFocus } from "@/lib/pipeline"
import { dayPublished, extrasForDay, slotsForDay, slotsInRange, workload, type SlotContext } from "@/lib/slots"
import { useApp } from "@/lib/store"
import { dmCount, dmStreak, focusStreak, postStreak } from "@/lib/streaks"
import type { Pillar, Post } from "@/lib/types"
import { useToday, useUi } from "@/lib/ui"
import { cn } from "@/lib/utils"

export function TodayView() {
  const { today, hour } = useToday()
  const posts = useApp((s) => s.posts)
  const rhythm = useApp((s) => s.rhythm)
  const settings = useApp((s) => s.settings)
  const leads = useApp((s) => s.leads)
  const removeSamples = useApp((s) => s.removeSamples)

  const ctx: SlotContext = useMemo(() => ({ rhythm, posts, settings, today }), [rhythm, posts, settings, today])
  const load = useMemo(() => workload(ctx), [ctx])
  const hasSamples = posts.some((p) => p.isSample) || leads.some((l) => l.isSample)

  return (
    <div className="mx-auto max-w-[680px] space-y-4 sm:space-y-6">
      <header>
        <div className="flex items-center justify-between gap-3 sm:flex-col-reverse sm:items-start sm:gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting(hour)}</h1>
          <Chip>{fmt(today, "EEEE d MMMM")}</Chip>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {load.toPublish} to publish today · {load.toWrite} to write in the next 2 weeks
        </p>
      </header>

      <GoalStrip today={today} />
      <QuickCapture />
      <ToPublish ctx={ctx} />
      <TodaysThree ctx={ctx} />
      <WeekChecklist ctx={ctx} />

      {hasSamples && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          <span>A few sample posts and leads are here to show how things work.</span>
          <MutedLink
            className="shrink-0 font-medium text-foreground"
            onClick={() => {
              removeSamples()
              toast("Samples removed")
            }}
          >
            Remove samples
          </MutedLink>
        </div>
      )}

      <RuleFooter today={today} />
    </div>
  )
}

function GoalStrip({ today }: { today: string }) {
  const settings = useApp((s) => s.settings)
  const weekStart = weekStartOf(today)
  const goal = useApp((s) => s.weeklyGoals[weekStart])
  const setWeekGoal = useApp((s) => s.setWeekGoal)
  const toggleDone = useApp((s) => s.toggleWeekGoalDone)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const run = runDay(today, settings)
  const left = daysLeftInWeek(today)

  const save = () => {
    setWeekGoal(weekStart, draft.trim())
    setEditing(false)
  }

  const meta = (
    <div className="flex shrink-0 flex-wrap gap-1.5">
      <Chip>{left === 1 ? "Last day" : `${left} days left`}</Chip>
      <Chip>
        Day {run.day} of {run.total}
      </Chip>
    </div>
  )

  if (!goal?.title || editing) {
    return (
      <Panel className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-3">
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim()) save()
          }}
        >
          <span className="shrink-0 pl-1 text-sm font-medium">This week</span>
          <Input
            autoFocus={editing}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Set this week's goal"
            className="h-9 border-0 bg-row shadow-none"
          />
          <Button type="submit" variant="outline" className="h-9" disabled={!draft.trim()}>
            Set
          </Button>
        </form>
        {meta}
      </Panel>
    )
  }

  return (
    <Panel className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-3">
      <div className="flex min-w-0 flex-1 items-start gap-2.5 pl-1">
        <Checkbox
          checked={goal.done}
          onCheckedChange={() => toggleDone(weekStart)}
          aria-label="Goal done"
          className="mt-0.5 size-[18px] rounded-full"
        />
        <button
          type="button"
          className="min-w-0 text-left text-sm"
          onClick={() => {
            setDraft(goal.title)
            setEditing(true)
          }}
        >
          <span className="font-medium">This week: </span>
          <span className={cn(goal.done && "text-muted-foreground line-through")}>{goal.title}</span>
        </button>
      </div>
      {meta}
    </Panel>
  )
}

function QuickCapture() {
  const addIdea = useApp((s) => s.addIdea)
  const [text, setText] = useState("")
  const [pillar, setPillar] = useState<Pillar | null>(null)

  return (
    <form
      className="flex items-center gap-2 rounded-xl border bg-card p-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        addIdea(text.trim(), pillar)
        setText("")
        setPillar(null)
        toast("Idea saved", { description: "Find it in Library → My posts, or pick it when you fill a slot." })
      }}
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Drop an idea while it's fresh…"
        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        aria-label="New idea"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" aria-label="Pillar">
            {pillar ? <PillarMark pillar={pillar} /> : <TagIcon className="text-muted-foreground" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Pillar (optional)</DropdownMenuLabel>
          {PILLARS.map((p) => (
            <DropdownMenuItem key={p} onClick={() => setPillar(p)}>
              <PillarMark pillar={p} /> {PILLAR_LABEL[p]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPillar(null)}>No pillar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="submit" variant={text.trim() ? "default" : "secondary"} className="h-9 shrink-0" disabled={!text.trim()}>
        Save idea
      </Button>
    </form>
  )
}

function ToPublish({ ctx }: { ctx: SlotContext }) {
  const router = useRouter()
  const [platform, setPlatform] = useState<Platform>("x")
  const openPost = useUi((s) => s.openPost)
  const newPost = useUi((s) => s.newPost)
  const markPosted = useApp((s) => s.markPosted)
  const savePost = useApp((s) => s.savePost)
  const slots = slotsForDay(ctx.today, ctx)
  const extras = extrasForDay(ctx.today, ctx)

  const posted = (post: Post) => {
    markPosted(post.id)
    toast("Nice. Marked as posted.", { action: { label: "Undo", onClick: () => savePost(post) } })
  }

  const postRow = (post: Post) => (
    <Row key={post.id} className="flex items-center gap-2.5">
      <PillarMark pillar={post.pillar} />
      <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => openPost(post.id)}>
        {firstLine(post.xText || post.angle)}
      </button>
      {post.status !== "posted" && post.status !== "ready" && <StatusPill status={post.status} className="hidden sm:inline-flex" />}
      <CopyButton text={textFor(post, platform)} toastLabel={platform === "x" ? "Copied for X" : "Copied for LinkedIn"} className="size-9 sm:size-7" />
      {post.status === "posted" ? (
        <span className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground sm:h-7">
          <CheckIcon className="size-3.5" /> Posted
        </span>
      ) : (
        <Button variant="outline" size="sm" className="h-9 bg-card sm:h-7" onClick={() => posted(post)}>
          <CheckIcon /> Posted
        </Button>
      )}
    </Row>
  )

  return (
    <Panel>
      <PanelHeader
        icon={SendIcon}
        title="To publish"
        meta={
          <ToggleGroup type="single" size="sm" spacing={0} variant="outline" value={platform} onValueChange={(v) => v && setPlatform(v as Platform)} aria-label="Copy for">
            <ToggleGroupItem value="x" className="h-6 px-2 text-xs">
              X
            </ToggleGroupItem>
            <ToggleGroupItem value="linkedin" className="h-6 px-2 text-xs">
              LinkedIn
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />
      <div className="space-y-2">
        {slots.map((s) =>
          s.post ? (
            postRow(s.post)
          ) : (
            <Row key={s.slotIndex} className="flex items-center gap-2.5">
              <PillarMark pillar={s.pillar} open />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                Today&apos;s {PILLAR_LABEL[s.pillar].toLowerCase()} slot is open — write one
              </span>
              <Button variant="outline" size="sm" className="h-9 bg-card sm:h-7" onClick={() => newPost({ date: ctx.today, slotIndex: s.slotIndex, pillar: s.pillar })}>
                <PencilLineIcon /> Write
              </Button>
            </Row>
          ),
        )}
        {extras.map(postRow)}
        {slots.length === 0 && extras.length === 0 && (
          <Row className="text-sm text-muted-foreground">No slot today. A good day to get ahead.</Row>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <MutedLink onClick={() => router.push("/library/audience")}>
          <SparklesIcon className="size-3" /> Need an idea?
        </MutedLink>
        <MutedLink onClick={() => router.push("/calendar")}>
          Open calendar <Arrow />
        </MutedLink>
      </div>
    </Panel>
  )
}

function TodaysThree({ ctx }: { ctx: SlotContext }) {
  const touches = useApp((s) => s.touches)
  const dayLogs = useApp((s) => s.dayLogs)
  const make = useApp((s) => s.make)
  const toggleFocus = useApp((s) => s.toggleFocus)
  const setFocusRef = useApp((s) => s.setFocusRef)
  const addQuickDm = useApp((s) => s.addQuickDm)
  const removeTouch = useApp((s) => s.removeTouch)
  const openPost = useUi((s) => s.openPost)
  const newPost = useUi((s) => s.newPost)
  const setSettingsOpen = useUi((s) => s.setSettingsOpen)
  const [dmOpen, setDmOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)

  const settings = useApp((s) => s.settings)
  const { today } = ctx
  const target = settings.dmTarget
  const dms = dmCount(today, touches)
  const published = slotsForDay(today, ctx).length > 0 ? dayPublished(today, ctx) : ctx.posts.some((p) => p.date === today && p.status === "posted")
  const log = dayLogs[today]
  const focus = pickFocus(make, log?.focusRef ?? null)
  const streaks = {
    dm: dmStreak(today, touches, target, settings.runStart),
    post: postStreak(ctx),
    focus: focusStreak(today, dayLogs, settings.runStart),
  }
  const done = [dms >= target, published, !!log?.focusDone].filter(Boolean).length

  const logDm = (segment: (typeof SEGMENTS)[number] | null) => {
    const id = addQuickDm(segment)
    setDmOpen(false)
    toast(`DM logged · ${dms + 1}/${target}`, { action: { label: "Undo", onClick: () => removeTouch(id) } })
  }

  const openToday = () => {
    const slot = slotsForDay(today, ctx).find((s) => s.post?.status !== "posted")
    if (slot?.post) openPost(slot.post.id)
    else if (slot) newPost({ date: today, slotIndex: slot.slotIndex, pillar: slot.pillar })
  }

  const streakText = (n: number) => (n >= 2 ? `${n}-day streak` : null)

  return (
    <Panel>
      <PanelHeader icon={CheckIcon} title="Today's three" meta={`${done}/3`} />
      <div className="space-y-2">
        <Row className="flex items-center gap-3">
          <AutoTick done={dms >= target} />
          <Link href="/library/pipeline" className="min-w-0 flex-1">
            <span className="block text-sm">{target} warm DMs</span>
            <span className="block text-xs text-muted-foreground">{streakText(streaks.dm) ?? "Opens your pipeline"}</span>
          </Link>
          <span className="text-sm tabular-nums">
            {dms}
            <span className="text-muted-foreground">/{target}</span>
          </span>
          <Popover open={dmOpen} onOpenChange={setDmOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 bg-card px-3 sm:h-7" aria-label="Log a DM">
                <PlusIcon /> 1
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <p className="px-1.5 pt-0.5 pb-2 text-xs text-muted-foreground">Who did you message?</p>
              <div className="grid gap-1">
                {SEGMENTS.map((seg) => (
                  <Button key={seg} variant="ghost" className="h-10 justify-start" onClick={() => logDm(seg)}>
                    {SEGMENT_LABEL[seg]}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </Row>

        <Row className="flex items-center gap-3">
          <AutoTick done={published} />
          <button type="button" className="min-w-0 flex-1 text-left" onClick={openToday}>
            <span className="block text-sm">Publish today&apos;s post</span>
            <span className="block text-xs text-muted-foreground">{streakText(streaks.post) ?? "Ticks itself when it's posted"}</span>
          </button>
        </Row>

        <Row className="flex items-center gap-3">
          <Checkbox
            checked={!!log?.focusDone}
            disabled={!focus}
            onCheckedChange={() => toggleFocus(today)}
            aria-label="Focus block done"
            className="size-[18px] rounded-full"
          />
          <div className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm", log?.focusDone && "text-muted-foreground line-through")}>
              {focus ? `Focus: ${focus.title}` : "Focus block"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {streakText(streaks.focus) ?? (focus ? MAKE_KIND_LABEL[focus.kind] : "Add things to make in Settings")}
            </span>
          </div>
          <Popover open={focusOpen} onOpenChange={setFocusOpen}>
            <PopoverTrigger asChild>
              <MutedLink className="h-9 px-1">change</MutedLink>
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-80 w-72 overflow-y-auto p-2">
              {(["client", "branding", "template"] as const).map((kind) => {
                const items = make.filter((m) => m.kind === kind && !m.done)
                if (!items.length) return null
                return (
                  <div key={kind} className="mb-1">
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">{MAKE_KIND_LABEL[kind]}</p>
                    {items.map((m) => (
                      <Button
                        key={m.id}
                        variant="ghost"
                        className={cn("h-auto min-h-9 w-full justify-start py-2 text-left whitespace-normal", focus?.id === m.id && "bg-muted")}
                        onClick={() => {
                          setFocusRef(today, m.id)
                          setFocusOpen(false)
                        }}
                      >
                        {m.title}
                      </Button>
                    ))}
                  </div>
                )
              })}
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  setFocusOpen(false)
                  setSettingsOpen(true)
                }}
              >
                Edit lists in Settings <Arrow />
              </Button>
            </PopoverContent>
          </Popover>
        </Row>
      </div>
    </Panel>
  )
}

function AutoTick({ done }: { done: boolean }) {
  return (
    <span
      aria-label={done ? "Done" : "Not done yet"}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full border",
        done ? "border-primary bg-primary text-primary-foreground" : "border-input",
      )}
    >
      {done && <CheckIcon className="size-3" />}
    </span>
  )
}

function WeekChecklist({ ctx }: { ctx: SlotContext }) {
  const router = useRouter()
  const weekStart = weekStartOf(ctx.today)
  const goal = useApp((s) => s.weeklyGoals[weekStart])
  const leads = useApp((s) => s.leads)
  const toggle = useApp((s) => s.toggleWeekCheck)
  const setReviewOpen = useUi((s) => s.setReviewOpen)
  const checks = goal?.checks ?? []

  const nextWeek = addDaysTo(weekStart, 7)
  const nextOpen = slotsInRange(nextWeek, addDaysTo(nextWeek, 6), ctx).filter((s) => s.state === "open").length
  const due = leads.filter((l) => isDue(l, ctx.today)).length
  const isSunday = weekdayOf(ctx.today) === 6

  const items = [
    { key: "followup", title: "Follow up on DMs", hint: "Reply to anyone due today.", meta: due ? `${due} due` : null, open: () => router.push("/library/pipeline?filter=due") },
    { key: "plan", title: "Plan next week", hint: "Fill next week's open slots.", meta: nextOpen ? `${nextOpen} open` : null, open: () => router.push(`/calendar?view=week&at=${nextWeek}`) },
    { key: "recycle", title: "Recycle a winner", hint: "Give last month's best post a new angle.", meta: null, open: () => router.push("/library/posts?filter=best") },
    { key: "proof", title: "Update your proof", hint: "New result or kind words? Add it now.", meta: null, open: () => router.push("/library/proof") },
    ...(isSunday
      ? [{ key: "review", title: "Sunday review", hint: "Five minutes, then set next week's goal.", meta: null, open: () => setReviewOpen(true) }]
      : []),
  ]
  const doneCount = items.filter((i) => checks.includes(i.key)).length

  return (
    <Panel>
      <PanelHeader icon={ListChecksIcon} title="This week" meta={`${doneCount}/${items.length} done`} />
      <div className="space-y-2">
        {items.map((item) => {
          const checked = checks.includes(item.key)
          return (
            <Row key={item.key} className="flex items-start gap-3">
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(weekStart, item.key)}
                aria-label={item.title}
                className="mt-0.5 size-[18px] rounded-full"
              />
              <div className="min-w-0 flex-1">
                <span className={cn("block text-sm", checked && "text-muted-foreground line-through")}>{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.hint}</span>
              </div>
              {item.meta && <Chip className="hidden bg-card sm:inline-flex">{item.meta}</Chip>}
              <MutedLink onClick={item.open} className="h-6 shrink-0">
                Open <Arrow />
              </MutedLink>
            </Row>
          )
        })}
      </div>
    </Panel>
  )
}

function RuleFooter({ today }: { today: string }) {
  const rules = useApp((s) => s.playbook.rules)
  const settings = useApp((s) => s.settings)
  if (!rules.length) return null
  const day = Math.max(runDay(today, settings).day, 1)
  const rule = rules[(day - 1) % rules.length]
  return (
    <div className="flex items-start gap-2.5 px-1 pb-2 text-xs text-muted-foreground">
      <BookOpenIcon className="mt-px size-3.5 shrink-0" />
      <p>
        <span className="font-medium text-foreground">Today&apos;s rule:</span> {rule}
      </p>
    </div>
  )
}

"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  CompassIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  PlusIcon,
  Repeat2Icon,
  ScaleIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { EditableText } from "@/components/editable-text"
import { Chip, Panel, PanelHeader, PillarMark, Row } from "@/components/kit"
import { RhythmEditor } from "@/components/rhythm-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PILLAR_SWATCHES, tone, TONES } from "@/lib/colors"
import { addDaysTo, diffDays, fmt } from "@/lib/dates"
import { SEGMENT_LABEL, SEGMENTS, WEEKDAY_SHORT } from "@/lib/labels"
import { usePillars } from "@/lib/pillars"
import { useApp } from "@/lib/store"
import type { PillarDef, Segment } from "@/lib/types"
import { useToday, useUi } from "@/lib/ui"
import { cn } from "@/lib/utils"

export function PlaybookView() {
  const playbook = useApp((s) => s.playbook)
  const updatePlaybook = useApp((s) => s.updatePlaybook)

  return (
    <div className="space-y-6">
      <header>
        <Chip>Playbook</Chip>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">The strategy</h1>
        <EditableText value={playbook.strategy} onSave={(strategy) => updatePlaybook({ strategy })} className="-mx-2 mt-1 text-muted-foreground" />
      </header>

      <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          Shaped by what <span className="text-foreground">Liutauras Liucvaikis</span> shares in public about how design studio founders win clients through content. Adapted here for a solo designer.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://x.com/liutauras_liu" target="_blank" rel="noreferrer">
              @liutauras_liu <ArrowUpRightIcon />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://brandedwords.studio" target="_blank" rel="noreferrer">
              brandedwords.studio <ArrowUpRightIcon />
            </a>
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader icon={CompassIcon} title="In one breath" />
        <Row className="p-1.5">
          <EditableText value={playbook.summary} onSave={(summary) => updatePlaybook({ summary })} multiline />
        </Row>
        <p className="mt-3 px-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Content comes from real work.</span> Proof items and client projects come first as sources.
        </p>
      </Panel>

      <PillarsSection />
      <RhythmCard />

      <RulesCard />
      <NicheCheck />
    </div>
  )
}

function PillarsSection() {
  const pillars = usePillars()
  const addPillar = useApp((s) => s.addPillar)
  const full = pillars.list.length >= 6
  return (
    <section id="pillars" className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-sm font-medium">Your pillars</h2>
          <p className="text-xs text-muted-foreground">3–5 works best. Fewer categories, clearer focus. Each one gets its own colour.</p>
        </div>
        <Button variant="outline" size="sm" disabled={full} onClick={() => addPillar()}>
          <PlusIcon /> {full ? "6 is the most" : "Add pillar"}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {pillars.list.map((p, i) => (
          <PillarCard key={p.id} pillar={p} first={i === 0} last={i === pillars.list.length - 1} />
        ))}
      </div>
    </section>
  )
}

function RhythmCard() {
  const rhythm = useApp((s) => s.rhythm)
  const pillars = usePillars()
  const [editing, setEditing] = useState(false)

  return (
    <Panel>
      <PanelHeader
        icon={Repeat2Icon}
        title={`${rhythm.length} posts a week`}
        meta={
          <Button variant={editing ? "default" : "outline"} size="sm" className="h-7" onClick={() => setEditing(!editing)}>
            {editing ? "Done" : "Edit rhythm"}
          </Button>
        }
      />
      <p className="mb-4 text-sm text-muted-foreground">Every post gets a visual, ideally with motion. Business posts carry the call to action.</p>
      {editing ? (
        <RhythmEditor />
      ) : (
        <div className="grid grid-cols-7 gap-1.5 max-sm:-mx-1">
          {WEEKDAY_SHORT.map((day, weekday) => (
            <div key={day} className="min-w-0 rounded-lg bg-row p-1.5 sm:p-2">
              <p className="mb-1.5 text-[11px] text-muted-foreground">{day}</p>
              <div className="space-y-1">
                {rhythm
                  .filter((r) => r.weekday === weekday)
                  .sort((a, b) => a.slotIndex - b.slotIndex)
                  .map((r) => {
                    const t = pillars.tone(r.pillar)
                    return (
                      <div key={r.id} className={cn("flex items-center gap-1.5 rounded-md border px-1 py-1 text-[11px] sm:px-1.5", t.soft, t.border, t.text)}>
                        <span className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
                        <span className="truncate font-medium max-sm:hidden">{pillars.name(r.pillar)}</span>
                        <span className="font-medium sm:hidden">{pillars.letter(r.pillar)}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        {pillars.list.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", pillars.tone(p.id).dot)} />
            {p.name} <span className="text-foreground">{rhythm.filter((r) => r.pillar === p.id).length}/week</span>
          </span>
        ))}
      </div>
    </Panel>
  )
}

function PillarCard({ pillar, first, last }: { pillar: PillarDef; first: boolean; last: boolean }) {
  const prompts = useApp((s) => s.prompts)
  const rhythm = useApp((s) => s.rhythm)
  const posts = useApp((s) => s.posts)
  const addItem = useApp((s) => s.addItem)
  const updateItem = useApp((s) => s.updateItem)
  const removeItem = useApp((s) => s.removeItem)
  const updatePillar = useApp((s) => s.updatePillar)
  const movePillar = useApp((s) => s.movePillar)
  const newPost = useUi((s) => s.newPost)
  const pillars = usePillars()
  const [draft, setDraft] = useState("")
  const [removing, setRemoving] = useState(false)
  const t = tone(pillar.color)
  const examples = prompts.filter((p) => p.pillar === pillar.id && p.angle === null)
  const perWeek = rhythm.filter((r) => r.pillar === pillar.id).length
  const usedColors = new Set(pillars.list.filter((p) => p.id !== pillar.id).map((p) => p.color))

  return (
    <article className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", t.border)}>
      <div className={cn("flex items-center gap-2 px-4 py-3", t.soft)}>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Change colour" className={cn("size-5 shrink-0 rounded-full ring-2 ring-card", t.dot)} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-3">
            <p className="mb-2 text-xs text-muted-foreground">Colour</p>
            <div className="grid grid-cols-4 gap-2">
              {PILLAR_SWATCHES.map((c) => {
                const taken = usedColors.has(c)
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={taken}
                    title={taken ? `${TONES[c].label} · used by another pillar` : TONES[c].label}
                    onClick={() => updatePillar(pillar.id, { color: c })}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md border transition-transform",
                      TONES[c].soft,
                      TONES[c].border,
                      pillar.color === c && "ring-2 ring-foreground/40",
                      taken ? "cursor-not-allowed opacity-30" : "hover:scale-105",
                    )}
                  >
                    <span className={cn("size-3 rounded-full", TONES[c].dot)} />
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
        <div className={cn("min-w-0 flex-1 font-medium", t.text)}>
          <EditableText value={pillar.name} onSave={(name) => name && updatePillar(pillar.id, { name })} className="text-sm font-medium" />
        </div>
        <span className={cn("shrink-0 text-xs", t.text)}>{perWeek ? `${perWeek} a week` : "not in rhythm"}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Pillar options" className={t.text}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={first} onClick={() => movePillar(pillar.id, -1)}>
              <ArrowUpIcon /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={last} onClick={() => movePillar(pillar.id, 1)}>
              <ArrowDownIcon /> Move down
            </DropdownMenuItem>
            <DropdownMenuItem disabled={pillars.list.length <= 1} onClick={() => setRemoving(true)}>
              <Trash2Icon /> Remove pillar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <EditableText
          value={pillar.definition}
          onSave={(definition) => updatePillar(pillar.id, { definition })}
          placeholder="What goes in this pillar?"
          multiline
          className="-mx-2"
        />
        <div className="mt-3 rounded-lg bg-row p-2">
          <ul className="space-y-0.5">
            {examples.map((e) => (
              <li key={e.id} className="group flex items-start gap-1">
                <span className={cn("mt-2.5 ml-1 size-1.5 shrink-0 rounded-full", t.dot)} />
                <div className="min-w-0 flex-1">
                  <EditableText value={e.text} onSave={(text) => (text ? updateItem("prompts", e.id, { text }) : removeItem("prompts", e.id))} className="text-xs" />
                </div>
                <Button variant="ghost" size="icon-xs" aria-label="Write this" className="mt-0.5 text-muted-foreground" onClick={() => newPost({ pillar: pillar.id, angle: e.text })}>
                  <PencilLineIcon />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label="Remove" className="mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 max-md:hidden" onClick={() => removeItem("prompts", e.id)}>
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(ev) => {
              ev.preventDefault()
              if (!draft.trim()) return
              addItem("prompts", { pillar: pillar.id, angle: null, text: draft.trim() })
              setDraft("")
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an example…" className="mt-1 h-8 border-0 bg-transparent text-xs shadow-none dark:bg-transparent" />
          </form>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-foreground/80">Why it works</p>
          <EditableText value={pillar.why} onSave={(why) => updatePillar(pillar.id, { why })} placeholder="Why this earns attention or trust" multiline className="-mx-2 text-xs text-muted-foreground" />
        </div>
        <div className="mt-auto pt-4">
          <Button variant="outline" size="sm" className={cn("h-8", t.soft, t.border, t.text, t.softHover)} onClick={() => newPost({ pillar: pillar.id })}>
            <PencilLineIcon /> Write one
          </Button>
        </div>
      </div>
      {removing && (
        <RemovePillarDialog
          pillar={pillar}
          others={pillars.list.filter((p) => p.id !== pillar.id)}
          postCount={posts.filter((p) => p.pillar === pillar.id).length}
          slotCount={perWeek}
          onClose={() => setRemoving(false)}
        />
      )}
    </article>
  )
}

function RemovePillarDialog({
  pillar,
  others,
  postCount,
  slotCount,
  onClose,
}: {
  pillar: PillarDef
  others: PillarDef[]
  postCount: number
  slotCount: number
  onClose: () => void
}) {
  const removePillar = useApp((s) => s.removePillar)
  const [moveTo, setMoveTo] = useState<string>(others[0]?.id ?? "none")
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove “{pillar.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            It has {postCount} {postCount === 1 ? "post" : "posts"} and {slotCount} {slotCount === 1 ? "slot" : "slots"} a week. Where should they go?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select value={moveTo} onValueChange={setMoveTo}>
          <SelectTrigger className="w-full data-[size=default]:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {others.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <PillarMark pillar={p.id} className="size-4 text-[9px]" />
                Move to {p.name}
              </SelectItem>
            ))}
            <SelectItem value="none">No pillar (and drop its slots)</SelectItem>
          </SelectContent>
        </Select>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              removePillar(pillar.id, moveTo === "none" ? null : moveTo)
              toast(`“${pillar.name}” removed`)
              onClose()
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RulesCard() {
  const rules = useApp((s) => s.playbook.rules)
  const updatePlaybook = useApp((s) => s.updatePlaybook)
  const [draft, setDraft] = useState("")
  const setRules = (next: string[]) => updatePlaybook({ rules: next })

  return (
    <Panel>
      <PanelHeader icon={ScaleIcon} title="Rules" meta="One shows on Today each day" />
      <ol className="space-y-1.5">
        {rules.map((r, i) => (
          <li key={`${i}-${r}`} className="group flex items-start gap-2 rounded-lg bg-row px-2 py-0.5">
            <span className="w-4 shrink-0 pt-1.5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <EditableText value={r} onSave={(v) => setRules(v ? rules.map((x, j) => (j === i ? v : x)) : rules.filter((_, j) => j !== i))} />
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="Remove" className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 max-md:opacity-100" onClick={() => setRules(rules.filter((_, j) => j !== i))}>
              <XIcon />
            </Button>
          </li>
        ))}
      </ol>
      <form
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          setRules([...rules, draft.trim()])
          setDraft("")
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a rule…" className="h-9 border-dashed bg-transparent shadow-none" />
      </form>
    </Panel>
  )
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function NicheCheck() {
  const { today } = useToday()
  const settings = useApp((s) => s.settings)
  const touches = useApp((s) => s.touches)
  const leads = useApp((s) => s.leads)
  const decision = useApp((s) => s.playbook.nicheDecision)
  const updatePlaybook = useApp((s) => s.updatePlaybook)
  const opensOn = addDaysTo(settings.runStart, 30)
  const isOpen = today >= opensOn
  const daysIn = Math.max(0, Math.min(30, diffDays(today, settings.runStart) + 1))

  const rows = SEGMENTS.map((seg: Segment) => {
    const segLeads = leads.filter((l) => l.segment === seg && !l.isSample)
    const dms = touches.filter((t) => (t.segment ?? leads.find((l) => l.id === t.leadId)?.segment) === seg).length
    const replies = segLeads.filter((l) => l.repliedAt).length
    const calls = segLeads.filter((l) => l.callBookedAt).length
    const won = segLeads.filter((l) => l.stage === "won").length
    return { seg, dms, replies, calls, won, replyRate: pct(replies, dms), callRate: pct(calls, replies), winRate: pct(won, calls) }
  })
  const maxRate = Math.max(1, ...rows.map((r) => r.replyRate))

  return (
    <Panel>
      <PanelHeader icon={ScaleIcon} title="Day-30 niche check" meta={isOpen ? `Opened ${fmt(opensOn, "d MMM")}` : `Opens ${fmt(opensOn, "EEE d MMM")}`} />
      {!isOpen && (
        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Collecting 30 days of DMs before you decide</span>
            <span className="tabular-nums">{daysIn}/30</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-status-open">
            <div className="h-full rounded-full bg-status-posted" style={{ width: `${(daysIn / 30) * 100}%` }} />
          </div>
        </div>
      )}

      <div className={cn(!isOpen && "opacity-70")}>
        <div className="mb-4 space-y-2">
          {rows.map((r) => (
            <div key={r.seg} className="flex items-center gap-3 text-xs">
              <span className="w-20 shrink-0 text-muted-foreground">{SEGMENT_LABEL[r.seg]}</span>
              <div className="h-5 flex-1 rounded-md bg-row">
                <div className="h-full rounded-md bg-status-posted" style={{ width: `${(r.replyRate / maxRate) * 100}%`, minWidth: r.replyRate ? 4 : 0 }} title={`${r.replyRate}% reply rate`} />
              </div>
              <span className="w-24 shrink-0 tabular-nums">{r.replyRate}% reply rate</span>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">DMs</TableHead>
                <TableHead className="text-right">Replies</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Call rate</TableHead>
                <TableHead className="text-right">Win rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.seg}>
                  <TableCell>{SEGMENT_LABEL[r.seg]}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.dms}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.replies}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.calls}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.won}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.callRate}%</TableCell>
                  <TableCell className="text-right tabular-nums">{r.winRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Reply rate = replies ÷ DMs. Call rate = calls ÷ replies. Win rate = wins ÷ calls. Sample leads aren&apos;t counted.</p>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-medium text-foreground/80">Decision</p>
        <Row className="p-1.5">
          <EditableText value={decision} onSave={(nicheDecision) => updatePlaybook({ nicheDecision })} placeholder={isOpen ? "Which niche, and why? Write it down." : "Write this on day 30."} multiline />
        </Row>
      </div>
    </Panel>
  )
}

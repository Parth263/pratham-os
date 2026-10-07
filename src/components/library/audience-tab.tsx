"use client"

import { LightbulbIcon, PencilLineIcon, ShuffleIcon, UserRoundIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { EditableText } from "@/components/editable-text"
import { Chip, PageHeader, Panel, PanelHeader, PillarMark, Row } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AUDIENCE_LABEL, SEGMENT_LABEL } from "@/lib/labels"
import { usePillars } from "@/lib/pillars"
import { useApp } from "@/lib/store"
import type { AudienceKind, Prompt, Segment } from "@/lib/types"
import { useUi } from "@/lib/ui"

type Seg = "agency" | "ai_startup"
const NEXT_SEGMENT: Record<string, Segment | null> = { both: "agency", agency: "ai_startup", ai_startup: null, other: null }

function pickThree(prompts: Prompt[]): string[] {
  const pool = prompts.filter((p) => p.angle !== null).map((p) => p.id)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 3)
}

export function AudienceTab() {
  const [seg, setSeg] = useState<Seg>("agency")
  const audience = useApp((s) => s.audience)
  const lines = audience.filter((l) => l.segment === null || l.segment === seg || l.segment === "other")

  return (
    <div>
      <PageHeader
        chips={<Chip>{lines.length} lines</Chip>}
        title="Audience"
        subtitle="The people you write for and what keeps them stuck. Every line is a post waiting to happen."
        actions={
          <ToggleGroup type="single" variant="outline" spacing={0} value={seg} onValueChange={(v) => v && setSeg(v as Seg)}>
            <ToggleGroupItem value="agency" className="h-8 px-3 text-xs">
              Agency
            </ToggleGroupItem>
            <ToggleGroupItem value="ai_startup" className="h-8 px-3 text-xs">
              AI startup
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <IdealClient seg={seg} />
        <NeedAnIdea />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {(["problem", "question", "objection"] as const).map((kind) => (
          <LineColumn key={kind} kind={kind} seg={seg} />
        ))}
      </div>
    </div>
  )
}

function IdealClient({ seg }: { seg: Seg }) {
  const text = useApp((s) => s.idealClients[seg])
  const setIdealClient = useApp((s) => s.setIdealClient)
  return (
    <Panel>
      <PanelHeader icon={UserRoundIcon} title="Ideal client" meta={SEGMENT_LABEL[seg]} />
      <Row className="min-h-32 p-1.5">
        <EditableText key={seg} value={text} onSave={(v) => setIdealClient(seg, v)} multiline />
      </Row>
    </Panel>
  )
}

function NeedAnIdea() {
  const prompts = useApp((s) => s.prompts)
  const newPost = useUi((s) => s.newPost)
  const pillars = usePillars()
  const [ids, setIds] = useState(() => pickThree(prompts))
  const shown = ids.map((id) => prompts.find((p) => p.id === id)).filter((p): p is Prompt => !!p)

  return (
    <Panel>
      <PanelHeader
        icon={LightbulbIcon}
        title="Need an idea?"
        meta={
          <button type="button" onClick={() => setIds(pickThree(prompts))} className="inline-flex items-center gap-1 hover:text-foreground">
            <ShuffleIcon className="size-3" /> Shuffle
          </button>
        }
      />
      <div className="space-y-2">
        {shown.map((p) => (
          <Row key={p.id} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <PillarMark pillar={p.pillar} className="size-4 text-[9px]" />
                {pillars.name(p.pillar)} → {p.angle}
              </p>
              <p className="text-sm">{p.text}</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 shrink-0 bg-card" onClick={() => newPost({ pillar: p.pillar, angle: p.text })}>
              <PencilLineIcon /> Write
            </Button>
          </Row>
        ))}
        {shown.length === 0 && <Row className="text-sm text-muted-foreground">Add prompts in the Playbook to get ideas here.</Row>}
      </div>
    </Panel>
  )
}

function LineColumn({ kind, seg }: { kind: AudienceKind; seg: Seg }) {
  const audience = useApp((s) => s.audience)
  const addItem = useApp((s) => s.addItem)
  const updateItem = useApp((s) => s.updateItem)
  const removeItem = useApp((s) => s.removeItem)
  const newPost = useUi((s) => s.newPost)
  const [draft, setDraft] = useState("")
  const lines = audience.filter((l) => l.kind === kind && (l.segment === null || l.segment === seg || l.segment === "other"))
  const label = AUDIENCE_LABEL[kind]

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-sm font-medium">
          {label.title} <span className="ml-1 text-xs font-normal text-muted-foreground">{lines.length}</span>
        </h2>
        <span className="text-xs text-muted-foreground">{label.hint}</span>
      </div>
      <div className="space-y-1.5 rounded-xl border bg-card p-2">
        {lines.map((l) => (
          <div key={l.id} className="group flex items-start gap-1 rounded-lg px-1 hover:bg-row">
            <div className="min-w-0 flex-1">
              <EditableText value={l.text} onSave={(text) => (text ? updateItem("audience", l.id, { text }) : removeItem("audience", l.id))} />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 pt-1">
              <button
                type="button"
                title="Who this applies to. Click to change."
                onClick={() => updateItem("audience", l.id, { segment: NEXT_SEGMENT[l.segment ?? "both"] })}
                className="h-5 rounded px-1.5 text-[10px] text-muted-foreground hover:bg-muted"
              >
                {l.segment === "agency" ? "Agency" : l.segment === "ai_startup" ? "AI" : "Both"}
              </button>
              <Button variant="ghost" size="icon-xs" aria-label="Write a post from this" className="text-muted-foreground" onClick={() => newPost({ pillar: "educational", angle: l.text })}>
                <PencilLineIcon />
              </Button>
              <Button variant="ghost" size="icon-xs" aria-label="Remove" className="text-muted-foreground opacity-0 group-hover:opacity-100 max-md:opacity-100" onClick={() => removeItem("audience", l.id)}>
                <XIcon />
              </Button>
            </div>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.trim()) return
            addItem("audience", { kind, segment: null, text: draft.trim() })
            setDraft("")
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add a ${kind}…`} className="h-9 border-dashed bg-transparent shadow-none" />
        </form>
      </div>
    </section>
  )
}

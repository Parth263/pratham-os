"use client"

import { Layers3Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Chip, Empty, firstLine, PageHeader, Panel, PanelHeader, PillarMark, Row, StatusPill } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { fmt } from "@/lib/dates"
import { usePillars } from "@/lib/pillars"
import { upcomingOpenSlots } from "@/lib/slots"
import { blankPost, uid, useApp } from "@/lib/store"
import type { Pillar, Post, Proof } from "@/lib/types"
import { useToday, useUi } from "@/lib/ui"

/** Show it, teach from it, sell with it. Falls back to your first three pillars if these were renamed away. */
const PLAN: { pillar: Pillar; angle: (p: Proof) => string }[] = [
  { pillar: "visual", angle: (p) => `Show it: ${p.title}` },
  { pillar: "educational", angle: (p) => `The lesson behind ${p.title.toLowerCase()}` },
  { pillar: "business", angle: (p) => `What ${p.client || "the client"} got, and how the 10 days went` },
]

export function ThreePostsTab() {
  const { today } = useToday()
  const proof = useApp((s) => s.proof)
  const posts = useApp((s) => s.posts)
  const rhythm = useApp((s) => s.rhythm)
  const settings = useApp((s) => s.settings)
  const savePost = useApp((s) => s.savePost)
  const openPost = useUi((s) => s.openPost)
  const pillars = usePillars()
  const plan = PLAN.map((step, i) => ({ ...step, pillar: pillars.get(step.pillar) ? step.pillar : (pillars.list[i]?.id ?? null) }))
  const [proofId, setProofId] = useState<string>("")
  const [schedule, setSchedule] = useState(true)
  const chosen = proof.find((p) => p.id === proofId)

  const groups = Object.values(
    posts
      .filter((p) => p.groupId)
      .reduce<Record<string, Post[]>>((acc, p) => {
        ;(acc[p.groupId as string] ??= []).push(p)
        return acc
      }, {}),
  ).sort((a, b) => b[0].createdAt.localeCompare(a[0].createdAt))

  const create = () => {
    if (!chosen) return
    const groupId = uid()
    const taken = new Set<string>()
    const open = upcomingOpenSlots({ rhythm, posts, settings, today }, 60).flatMap((d) => d.slots)
    for (const step of plan) {
      const slot = schedule ? open.find((s) => s.pillar === step.pillar && !taken.has(`${s.date}:${s.slotIndex}`)) : undefined
      if (slot) taken.add(`${slot.date}:${slot.slotIndex}`)
      savePost(
        blankPost({
          groupId,
          sourceProofId: chosen.id,
          pillar: step.pillar,
          angle: step.angle(chosen),
          status: "draft",
          visualNote: step.pillar === "visual" ? chosen.title : "",
          date: slot?.date ?? null,
          slotIndex: slot?.slotIndex ?? null,
        }),
      )
    }
    toast(schedule ? "Three drafts added to your next open slots" : "Three drafts added")
    setProofId("")
  }

  return (
    <div>
      <PageHeader
        chips={<Chip>{groups.length} sets</Chip>}
        title="One idea, three posts"
        subtitle="Pick one piece of proof. Get a visual post, a lesson and an offer post from it."
      />
      <Panel className="mb-8">
        <PanelHeader icon={Layers3Icon} title="Start from proof" />
        {proof.length === 0 ? (
          <Row className="text-sm text-muted-foreground">Add something to Proof first.</Row>
        ) : (
          <div className="space-y-4">
            <Select value={proofId} onValueChange={setProofId}>
              <SelectTrigger className="w-full data-[size=default]:h-9">
                <SelectValue placeholder="Choose a project, result or testimonial" />
              </SelectTrigger>
              <SelectContent>
                {proof.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chosen && (
              <div className="space-y-2">
                {plan.map((step, i) => (
                  <Row key={i} className="flex items-center gap-2.5">
                    <PillarMark pillar={step.pillar} />
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{pillars.name(step.pillar)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{step.angle(chosen)}</span>
                  </Row>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={schedule} onCheckedChange={setSchedule} />
                Put them in the next open slots
              </label>
              <Button className="h-9" disabled={!chosen} onClick={create}>
                Create three drafts
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <h2 className="mb-3 px-1 text-sm font-medium">Your sets</h2>
      {groups.length === 0 ? (
        <Empty>Your sets show up here.</Empty>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const source = proof.find((p) => p.id === g[0].sourceProofId)
            return (
              <section key={g[0].groupId} className="rounded-xl border bg-card p-3">
                <p className="mb-2 px-1 text-xs text-muted-foreground">From: {source?.title ?? "a proof item"}</p>
                <div className="space-y-1.5">
                  {g.map((p) => (
                    <button key={p.id} type="button" onClick={() => openPost(p.id)} className="flex w-full items-center gap-2.5 rounded-lg bg-row px-3 py-2 text-left hover:bg-muted">
                      <PillarMark pillar={p.pillar} />
                      <span className="min-w-0 flex-1 truncate text-sm">{firstLine(p.xText || p.angle)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{p.date ? fmt(p.date, "EEE d MMM") : "Not scheduled"}</span>
                      <StatusPill status={p.status} />
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

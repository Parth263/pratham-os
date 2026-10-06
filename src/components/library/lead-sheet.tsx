"use client"

import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { DatePicker } from "@/components/date-picker"
import { Field, ResponsiveSheet } from "@/components/responsive-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CHANNEL_LABEL, CHANNELS, SEGMENT_LABEL, SEGMENTS, STAGE_LABEL, STAGES } from "@/lib/labels"
import { blankLead, useApp } from "@/lib/store"
import type { Channel, Lead, LeadStage, Segment } from "@/lib/types"
import { useUi } from "@/lib/ui"

export function LeadSheet() {
  const nonce = useUi((s) => s.lead.nonce)
  return <LeadEditor key={nonce} />
}

function LeadEditor() {
  const ui = useUi((s) => s.lead)
  const close = useUi((s) => s.closeLead)
  const leads = useApp((s) => s.leads)
  const saveLead = useApp((s) => s.saveLead)
  const setLeadStage = useApp((s) => s.setLeadStage)
  const deleteLead = useApp((s) => s.deleteLead)
  const [l, setL] = useState<Lead>(() => {
    const existing = ui.id ? leads.find((x) => x.id === ui.id) : undefined
    return existing ? { ...existing } : blankLead()
  })
  const set = (patch: Partial<Lead>) => setL((prev) => ({ ...prev, ...patch }))
  const original = leads.find((x) => x.id === l.id)

  function save() {
    if (!l.name.trim() && !l.company.trim()) {
      toast("Add a name or a company first.")
      return
    }
    // Stage changes go through the store so follow-ups and stage dates stay right.
    const prevStage = original?.stage ?? "found"
    saveLead({ ...l, stage: prevStage })
    if (l.stage !== prevStage) setLeadStage(l.id, l.stage)
    // A follow-up date picked by hand wins over the automatic one.
    const manualFollowUp = l.nextFollowUpAt !== (original?.nextFollowUpAt ?? null)
    const saved = useApp.getState().leads.find((x) => x.id === l.id)
    if (manualFollowUp && saved) saveLead({ ...saved, nextFollowUpAt: l.nextFollowUpAt })
    toast(original ? "Lead saved" : "Lead added")
    close()
  }

  return (
    <ResponsiveSheet
      open={ui.open}
      onOpenChange={(o) => !o && close()}
      title={original ? l.name || l.company || "Lead" : "New lead"}
      footer={
        <div className="flex items-center gap-2">
          {original && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete lead"
              className="text-muted-foreground"
              onClick={() => {
                deleteLead(l.id)
                close()
                toast("Lead deleted")
              }}
            >
              <Trash2Icon />
            </Button>
          )}
          <Button className="ml-auto h-9 px-4" onClick={save}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input data-autofocus value={l.name} onChange={(e) => set({ name: e.target.value })} className="h-9" />
          </Field>
          <Field label="Company">
            <Input value={l.company} onChange={(e) => set({ company: e.target.value })} className="h-9" />
          </Field>
        </div>
        <Field label="Link" hint="Profile or site">
          <Input value={l.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" className="h-9" />
        </Field>
        <Field label="Segment" hint="Feeds the day-30 niche check">
          <ToggleGroup type="single" variant="outline" spacing={0} className="w-full" value={l.segment} onValueChange={(v) => v && set({ segment: v as Segment })}>
            {SEGMENTS.map((s) => (
              <ToggleGroupItem key={s} value={s} className="h-9 flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {SEGMENT_LABEL[s]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Channel">
            <Select value={l.channel} onValueChange={(v) => set({ channel: v as Channel })}>
              <SelectTrigger className="w-full data-[size=default]:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stage">
            <Select value={l.stage} onValueChange={(v) => set({ stage: v as LeadStage })}>
              <SelectTrigger className="w-full data-[size=default]:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Next follow-up" hint="Set for you after contact">
            <DatePicker value={l.nextFollowUpAt} onChange={(nextFollowUpAt) => set({ nextFollowUpAt })} placeholder="None" />
          </Field>
          <Field label="Deal value (USD)">
            <Input
              inputMode="decimal"
              value={l.dealValueUsd ?? ""}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, "")
                set({ dealValueUsd: v ? Number(v) : null })
              }}
              className="h-9"
            />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={l.notes} onChange={(e) => set({ notes: e.target.value })} className="min-h-20" />
        </Field>
      </div>
    </ResponsiveSheet>
  )
}

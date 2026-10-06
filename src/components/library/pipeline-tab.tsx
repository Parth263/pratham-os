"use client"

import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Chip, Empty, PageHeader } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { relativeDay, weekStartOf } from "@/lib/dates"
import { SEGMENT_LABEL, SEGMENTS, STAGE_LABEL, STAGES } from "@/lib/labels"
import { isDue, weekPipelineStats } from "@/lib/pipeline"
import { useApp } from "@/lib/store"
import type { Lead, LeadStage } from "@/lib/types"
import { useToday, useUi } from "@/lib/ui"
import { cn } from "@/lib/utils"

type Filter = "due" | "all" | "agency" | "ai_startup" | "other"

export function PipelineTab({ initialFilter }: { initialFilter: "due" | "all" }) {
  const { today } = useToday()
  const leads = useApp((s) => s.leads)
  const touches = useApp((s) => s.touches)
  const openLead = useUi((s) => s.openLead)
  const [filter, setFilter] = useState<Filter>(initialFilter)

  const stats = weekPipelineStats(weekStartOf(today), today, leads, touches)
  const due = leads.filter((l) => isDue(l, today))
  const shown = leads
    .filter((l) => (filter === "due" ? isDue(l, today) : filter === "all" ? true : l.segment === filter))
    .sort((a, b) => {
      const da = isDue(a, today) ? 0 : 1
      const db = isDue(b, today) ? 0 : 1
      if (da !== db) return da - db
      return (a.nextFollowUpAt ?? "9999").localeCompare(b.nextFollowUpAt ?? "9999") || b.updatedAt.localeCompare(a.updatedAt)
    })

  return (
    <div>
      <PageHeader
        chips={<Chip>{leads.length} leads</Chip>}
        title="Pipeline"
        subtitle={`This week: ${stats.dms} ${stats.dms === 1 ? "DM" : "DMs"} · ${stats.replies} ${stats.replies === 1 ? "reply" : "replies"} · ${stats.calls} ${stats.calls === 1 ? "call" : "calls"}`}
        actions={
          <Button className="h-9" onClick={() => openLead(null)}>
            <PlusIcon /> Add lead
          </Button>
        }
      />
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ToggleGroup type="single" variant="outline" spacing={0} value={filter} onValueChange={(v) => v && setFilter(v as Filter)}>
          <ToggleGroupItem value="due" className="h-8 px-3 text-xs">
            Due today{due.length ? ` · ${due.length}` : ""}
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="h-8 px-3 text-xs">
            All
          </ToggleGroupItem>
          {SEGMENTS.map((s) => (
            <ToggleGroupItem key={s} value={s} className="h-8 px-3 text-xs whitespace-nowrap">
              {SEGMENT_LABEL[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {shown.length === 0 ? (
        <Empty>{filter === "due" ? "No one is due today. Nice and quiet." : "No leads here yet. Add the people you DM so follow-ups find you."}</Empty>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Lead</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="pr-4 text-right">Touch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => openLead(l.id)}>
                    <TableCell className="max-w-64 pl-4">
                      <LeadName lead={l} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{SEGMENT_LABEL[l.segment]}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <StageSelect lead={l} />
                    </TableCell>
                    <TableCell>
                      <FollowUp lead={l} today={today} />
                    </TableCell>
                    <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <TouchButton lead={l} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {shown.map((l) => (
              <div key={l.id} className="rounded-xl border bg-card p-3" onClick={() => openLead(l.id)}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <LeadName lead={l} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {SEGMENT_LABEL[l.segment]} · <FollowUp lead={l} today={today} />
                    </p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <TouchButton lead={l} />
                  </div>
                </div>
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <StageSelect lead={l} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LeadName({ lead }: { lead: Lead }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 truncate text-sm">
        <span className="truncate font-medium">{lead.company || lead.name}</span>
        {lead.isSample && <span className="rounded border px-1 text-[10px] text-muted-foreground">Sample</span>}
        {lead.url && (
          <a href={lead.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground" aria-label="Open link">
            <ExternalLinkIcon className="size-3.5" />
          </a>
        )}
      </p>
      {lead.company && lead.name && <p className="truncate text-xs text-muted-foreground">{lead.name}</p>}
    </div>
  )
}

function FollowUp({ lead, today }: { lead: Lead; today: string }) {
  if (!lead.nextFollowUpAt) return <span className="text-muted-foreground">—</span>
  const due = isDue(lead, today)
  return <span className={cn(due ? "font-medium text-foreground" : "text-muted-foreground")}>{due ? (lead.nextFollowUpAt < today ? "Overdue" : "Due today") : relativeDay(lead.nextFollowUpAt, today)}</span>
}

function StageSelect({ lead }: { lead: Lead }) {
  const setLeadStage = useApp((s) => s.setLeadStage)
  return (
    <Select
      value={lead.stage}
      onValueChange={(v) => {
        setLeadStage(lead.id, v as LeadStage)
        if (v === "won") toast(lead.dealValueUsd ? "Won. Revenue logged." : "Won. Add a deal value to log revenue.")
      }}
    >
      <SelectTrigger size="sm" className="h-8 w-36 bg-card text-xs max-md:w-full">
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
  )
}

function TouchButton({ lead }: { lead: Lead }) {
  const touchLead = useApp((s) => s.touchLead)
  const touches = useApp((s) => s.touches)
  const count = touches.filter((t) => t.leadId === lead.id).length
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 bg-card md:h-8"
      onClick={() => {
        touchLead(lead.id)
        toast("Touch logged. It counts toward today's DMs.")
      }}
    >
      <PlusIcon /> 1{count ? <span className="text-muted-foreground">· {count}</span> : null}
    </Button>
  )
}

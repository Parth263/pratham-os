import { addDaysTo } from "./dates"
import type { Day, Lead, LeadStage, MakeItem, Touch } from "./types"

/**
 * Follow-ups only run while a lead sits in Contacted:
 * first nudge 3 days after contact, a second on day 7, then it stops.
 */
export function afterTouch(lead: Lead, touchesForLead: number, today: Day): Partial<Lead> {
  const now = new Date().toISOString()
  if (lead.stage === "found") {
    return { stage: "contacted", contactedAt: today, nextFollowUpAt: addDaysTo(today, 3), lastTouchAt: now }
  }
  if (lead.stage === "contacted") {
    const contactedAt = lead.contactedAt ?? today
    return {
      lastTouchAt: now,
      contactedAt,
      nextFollowUpAt: touchesForLead <= 1 ? addDaysTo(contactedAt, 3) : touchesForLead === 2 ? addDaysTo(contactedAt, 7) : null,
    }
  }
  return { lastTouchAt: now }
}

export function afterStageChange(lead: Lead, stage: LeadStage, today: Day): Partial<Lead> {
  const patch: Partial<Lead> = { stage }
  if (stage === "contacted") {
    patch.contactedAt = lead.contactedAt ?? today
    patch.nextFollowUpAt = addDaysTo(patch.contactedAt, 3)
  } else {
    patch.nextFollowUpAt = null
  }
  if (stage === "replied" && !lead.repliedAt) patch.repliedAt = today
  if (stage === "call_booked" && !lead.callBookedAt) patch.callBookedAt = today
  if ((stage === "won" || stage === "lost") && !lead.closedAt) patch.closedAt = today
  return patch
}

export function isDue(lead: Lead, today: Day): boolean {
  return lead.nextFollowUpAt !== null && lead.nextFollowUpAt <= today
}

export function weekPipelineStats(weekStart: Day, today: Day, leads: Lead[], touches: Touch[]) {
  const end = addDaysTo(weekStart, 6)
  const inWeek = (d: Day | null) => d !== null && d >= weekStart && d <= end && d <= today
  return {
    dms: touches.filter((t) => inWeek(t.date)).length,
    replies: leads.filter((l) => inWeek(l.repliedAt)).length,
    calls: leads.filter((l) => inWeek(l.callBookedAt)).length,
    won: leads.filter((l) => l.stage === "won" && inWeek(l.closedAt)).length,
  }
}

/** Focus block: client work first, then branding practice, then templates. */
export function pickFocus(make: MakeItem[], overrideId: string | null): MakeItem | null {
  if (overrideId) {
    const chosen = make.find((m) => m.id === overrideId)
    if (chosen) return chosen
  }
  const open = make.filter((m) => !m.done)
  const client = open
    .filter((m) => m.kind === "client")
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.sortOrder - b.sortOrder)
  if (client[0]) return client[0]
  const byOrder = (kind: MakeItem["kind"]) => open.filter((m) => m.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder)
  return byOrder("branding")[0] ?? byOrder("template")[0] ?? null
}

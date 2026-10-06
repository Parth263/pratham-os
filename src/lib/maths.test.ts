import { describe, expect, it } from "vitest"
import { daysLeftInWeek, runDay, todayIST, weekStartOf, weekdayOf } from "./dates"
import { afterStageChange, afterTouch, pickFocus } from "./pipeline"
import { monthStats, pickSlot, workload, type SlotContext } from "./slots"
import { dmStreak, postStreak } from "./streaks"
import type { Lead, MakeItem, Pillar, Post, RhythmSlot, Touch } from "./types"

const settings = { runStart: "2026-10-06", runEnd: "2027-04-06" }
const pillars: Pillar[] = ["visual", "educational", "visual", "business", "visual", "educational", "personal"]
const rhythm: RhythmSlot[] = pillars.map((pillar, weekday) => ({ id: `r${weekday}`, weekday, slotIndex: 0, pillar }))

function post(p: Partial<Post>): Post {
  return {
    id: Math.random().toString(36),
    createdAt: "",
    updatedAt: "",
    pillar: "visual",
    angle: "",
    xText: "",
    linkedinText: "",
    visualNote: "",
    visualUrl: "",
    status: "draft",
    date: null,
    slotIndex: null,
    postedAt: null,
    xUrl: "",
    linkedinUrl: "",
    likes: null,
    replies: null,
    dmsFrom: null,
    isCta: false,
    sourceProofId: null,
    groupId: null,
    isSample: false,
    ...p,
  }
}

describe("dates in IST", () => {
  it("rolls over at IST midnight, not UTC", () => {
    expect(todayIST(new Date("2026-10-06T18:29:00Z"))).toBe("2026-10-06")
    expect(todayIST(new Date("2026-10-06T18:31:00Z"))).toBe("2026-10-07")
  })
  it("weeks run Monday to Sunday", () => {
    expect(weekdayOf("2026-10-05")).toBe(0) // Monday
    expect(weekdayOf("2026-10-11")).toBe(6) // Sunday
    expect(weekStartOf("2026-10-11")).toBe("2026-10-05")
    expect(daysLeftInWeek("2026-10-06")).toBe(6)
  })
  it("the run is 183 days and Oct 6 is day 1", () => {
    expect(runDay("2026-10-06", settings)).toEqual({ day: 1, total: 183, left: 182 })
    expect(runDay("2027-04-06", settings).day).toBe(183)
  })
})

describe("slots", () => {
  const ctx = (posts: Post[], today = "2026-10-06"): SlotContext => ({ rhythm, posts, settings, today })

  it("only counts slots inside the run", () => {
    const s = monthStats("2026-10-15", ctx([]))
    expect(s.total).toBe(26) // Oct 6–31
    expect(s.open).toBe(26)
    expect(s.perPillar.visual.total).toBe(11) // Mon 12,19,26 · Wed 7,14,21,28 · Fri 9,16,23,30
  })
  it("a post in a slot fills it; past empty slots are missed, not open", () => {
    const posts = [post({ date: "2026-10-06", slotIndex: 0, status: "posted", pillar: "educational" })]
    const s = monthStats("2026-10-01", ctx(posts, "2026-10-08"))
    expect(s.filled).toBe(1)
    expect(s.byStatus.posted).toBe(1)
    expect(s.open).toBe(24) // Oct 8–31
  })
  it("picks the matching pillar's free slot, else extra", () => {
    const twoSlots = [...rhythm, { id: "x", weekday: 1, slotIndex: 1, pillar: "visual" as Pillar }]
    const c = { rhythm: twoSlots, settings, posts: [] as Post[] }
    expect(pickSlot("2026-10-06", "visual", c)).toBe(1)
    expect(pickSlot("2026-10-06", "business", c)).toBe(0)
    const full = { ...c, posts: [post({ date: "2026-10-06", slotIndex: 0 }), post({ date: "2026-10-06", slotIndex: 1 })] }
    expect(pickSlot("2026-10-06", "visual", full)).toBeNull()
  })
  it("workload counts today and the next 2 weeks", () => {
    const w = workload(ctx([post({ date: "2026-10-06", slotIndex: 0, status: "ready" })]))
    expect(w.toPublish).toBe(1)
    expect(w.toWrite).toBe(13) // 14 days of slots, 1 filled with a ready post
  })
})

describe("streaks", () => {
  const touch = (date: string): Touch => ({ id: date + Math.random(), createdAt: "", updatedAt: "", leadId: null, date, channel: "x", segment: null })
  it("DM streak skips weekends and doesn't break on an unfinished today", () => {
    const touches = ["2026-10-09", "2026-10-12"].flatMap((d) => Array.from({ length: 10 }, () => touch(d)))
    // Fri 9 done, Sat/Sun skipped, Mon 12 done, Tue 13 (today) not yet
    expect(dmStreak("2026-10-13", touches, 10, "2026-10-06")).toBe(2)
  })
  it("post streak counts fully posted days", () => {
    const posts = ["2026-10-06", "2026-10-07"].map((date) => post({ date, slotIndex: 0, status: "posted" }))
    expect(postStreak({ rhythm, posts, settings, today: "2026-10-08" })).toBe(2)
  })
})

describe("pipeline", () => {
  const lead = { stage: "found", contactedAt: null, repliedAt: null, callBookedAt: null, closedAt: null } as unknown as Lead
  it("follow-ups land on day 3, then day 7, then stop", () => {
    expect(afterTouch(lead, 1, "2026-10-06").nextFollowUpAt).toBe("2026-10-09")
    const contacted = { ...lead, stage: "contacted", contactedAt: "2026-10-06" } as Lead
    expect(afterTouch(contacted, 2, "2026-10-09").nextFollowUpAt).toBe("2026-10-13")
    expect(afterTouch(contacted, 3, "2026-10-13").nextFollowUpAt).toBeNull()
    expect(afterStageChange(contacted, "replied", "2026-10-10")).toMatchObject({ nextFollowUpAt: null, repliedAt: "2026-10-10" })
  })
  it("focus picks client work, then branding, then templates", () => {
    const item = (kind: MakeItem["kind"], sortOrder: number, dueDate: string | null = null) =>
      ({ id: `${kind}${sortOrder}`, kind, sortOrder, dueDate, done: false, title: "" }) as MakeItem
    expect(pickFocus([item("template", 0), item("branding", 1)], null)?.kind).toBe("branding")
    expect(pickFocus([item("branding", 0), item("client", 2, "2026-10-20"), item("client", 1, "2026-10-09")], null)?.id).toBe("client1")
  })
})

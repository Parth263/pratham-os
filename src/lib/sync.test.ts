import { describe, expect, it } from "vitest"
import { seedData } from "./seed"
import { diffState, fromRows, signature, toRows } from "./sync"

describe("sync", () => {
  const base = seedData("2026-10-07")

  it("rows round-trip back to the same data", () => {
    const back = fromRows(toRows(base))
    expect(back.posts.map((p) => p.id).sort()).toEqual(base.posts.map((p) => p.id).sort())
    expect(back.pillars).toHaveLength(4)
    expect(back.settings).toEqual(base.settings)
    expect(back.playbook.rules).toEqual(base.playbook.rules)
    expect(back.weeklyGoals).toEqual(base.weeklyGoals)
  })

  it("only sends what changed", () => {
    const edited = { ...base.posts[0], xText: "changed" }
    const next = { ...base, posts: [edited, ...base.posts.slice(2)], settings: { ...base.settings, dmTarget: 12 } }
    const ops = diffState(base, next)
    expect(ops).toHaveLength(3) // 1 edited post, 1 removed post, settings
    expect(ops.filter((o) => o.kind === "delete")).toEqual([{ kind: "delete", collection: "posts", id: base.posts[1].id }])
    expect(ops.some((o) => o.kind === "upsert" && o.row.collection === "single" && o.row.id === "settings")).toBe(true)
  })

  it("nothing changed → nothing to send", () => {
    expect(diffState(base, { ...base })).toEqual([])
  })

  it("the fingerprint notices an add followed by a delete elsewhere", () => {
    const rows = [
      { collection: "posts", id: "a", updatedAt: "2026-10-07T10:00:00Z" },
      { collection: "single", id: "settings", updatedAt: "2026-10-07T11:00:00Z" },
    ]
    const swapped = [rows[1], { collection: "posts", id: "b", updatedAt: "2026-10-07T10:00:00Z" }]
    expect(signature(rows)).not.toBe(signature(swapped))
    expect(signature(rows)).toBe(signature([...rows].reverse()))
  })
})

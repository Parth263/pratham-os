"use client"

import { RefreshCwIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Chip, Empty, firstLine, PageHeader, PillarMark, StatusPill } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fmt } from "@/lib/dates"
import { blankPost, useApp } from "@/lib/store"
import type { Post } from "@/lib/types"
import { useUi } from "@/lib/ui"

type Filter = "posted" | "ideas" | "all"
type Sort = "newest" | "likes" | "replies" | "dmsFrom"
const SORT_LABEL: Record<Sort, string> = { newest: "Newest", likes: "Most likes", replies: "Most replies", dmsFrom: "Most DMs" }

export function MyPostsTab({ initialFilter }: { initialFilter: "best" | null }) {
  const posts = useApp((s) => s.posts)
  const savePost = useApp((s) => s.savePost)
  const openPost = useUi((s) => s.openPost)
  const [filter, setFilter] = useState<Filter>("posted")
  const [sort, setSort] = useState<Sort>(initialFilter === "best" ? "likes" : "newest")

  const shown = posts
    .filter((p) => (filter === "posted" ? p.status === "posted" : filter === "ideas" ? p.status === "idea" : true))
    .sort((a, b) => {
      if (sort === "newest") return (b.date ?? b.createdAt).localeCompare(a.date ?? a.createdAt)
      return (b[sort] ?? -1) - (a[sort] ?? -1)
    })

  const recycle = (p: Post) => {
    const fresh = blankPost({ pillar: p.pillar, angle: p.angle ? `New angle: ${p.angle}` : "", xText: p.xText, linkedinText: p.linkedinText, visualNote: p.visualNote, sourceProofId: p.sourceProofId })
    savePost(fresh)
    toast("Copied into a new draft")
    openPost(fresh.id)
  }

  return (
    <div>
      <PageHeader
        chips={<Chip>{posts.filter((p) => p.status === "posted").length} posted</Chip>}
        title="My posts"
        subtitle="What you've posted and how it did. A winner deserves a second go with a new angle."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ToggleGroup type="single" variant="outline" spacing={0} value={filter} onValueChange={(v) => v && setFilter(v as Filter)}>
          <ToggleGroupItem value="posted" className="h-8 px-3 text-xs">
            Posted
          </ToggleGroupItem>
          <ToggleGroupItem value="ideas" className="h-8 px-3 text-xs">
            Ideas
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="h-8 px-3 text-xs">
            All
          </ToggleGroupItem>
        </ToggleGroup>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="ml-auto bg-card text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shown.length === 0 ? (
        <Empty>
          {filter === "posted" ? "Nothing posted yet. Tap Posted on Today once it's live, then add likes and replies here." : filter === "ideas" ? "No saved ideas. Drop one in the box on Today." : "No posts yet."}
        </Empty>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {shown.map((p) => (
            <div key={p.id} role="button" tabIndex={0} onClick={() => openPost(p.id)} onKeyDown={(e) => e.key === "Enter" && openPost(p.id)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-row">
              <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{p.date ? fmt(p.date, "d MMM") : "—"}</span>
              <PillarMark pillar={p.pillar} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{firstLine(p.xText || p.angle)}</p>
                {p.status === "posted" && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {p.likes ?? "–"} likes · {p.replies ?? "–"} replies · {p.dmsFrom ?? "–"} DMs
                  </p>
                )}
              </div>
              {p.status !== "posted" && <StatusPill status={p.status} />}
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  recycle(p)
                }}
              >
                <RefreshCwIcon /> <span className="max-sm:hidden">Recycle</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

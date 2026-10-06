"use client"

import Link from "next/link"
import { AudienceTab } from "@/components/library/audience-tab"
import { MyPostsTab } from "@/components/library/my-posts-tab"
import { PipelineTab } from "@/components/library/pipeline-tab"
import { ProofTab } from "@/components/library/proof-tab"
import { SwipeTab, TemplatesTab } from "@/components/library/swipe-tabs"
import { ThreePostsTab } from "@/components/library/three-posts-tab"
import { LIBRARY_TABS, type LibraryTab } from "@/lib/library-tabs"
import { cn } from "@/lib/utils"

export function LibraryView({ tab, filter }: { tab: LibraryTab; filter: string | null }) {
  return (
    <div>
      <nav className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Library">
        <div className="inline-flex gap-1 rounded-lg border bg-card p-1">
          {LIBRARY_TABS.map((t) => (
            <Link
              key={t.id}
              href={`/library/${t.id}`}
              className={cn(
                "flex h-8 items-center rounded-md px-3 text-xs whitespace-nowrap transition-colors",
                t.id === tab ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      {tab === "proof" && <ProofTab />}
      {tab === "audience" && <AudienceTab />}
      {tab === "pipeline" && <PipelineTab initialFilter={filter === "due" ? "due" : "all"} />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "swipe" && <SwipeTab />}
      {tab === "posts" && <MyPostsTab initialFilter={filter === "best" ? "best" : null} />}
      {tab === "three" && <ThreePostsTab />}
    </div>
  )
}

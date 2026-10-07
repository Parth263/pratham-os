"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowRightIcon, CheckIcon } from "lucide-react"
import type * as React from "react"
import { cn } from "@/lib/utils"
import { STATUS_LABEL } from "@/lib/labels"
import { usePillars } from "@/lib/pillars"
import type { Pillar, PostStatus } from "@/lib/types"

export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)} {...props} />
}

export function PanelHeader({
  icon: Icon,
  title,
  meta,
  className,
}: {
  icon: LucideIcon
  title: React.ReactNode
  meta?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-4 flex items-center gap-2.5", className)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h2>
      {meta !== undefined && <div className="shrink-0 text-xs text-muted-foreground">{meta}</div>}
    </div>
  )
}

export function Row({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-lg bg-row px-3 py-2.5", className)} {...props} />
}

export function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-1 rounded-md bg-muted px-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/** A pillar's colour plus its first letter, so colour is never the only cue. */
export function PillarMark({ pillar, open, className }: { pillar: Pillar | null; open?: boolean; className?: string }) {
  const pillars = usePillars()
  const t = pillars.tone(pillar)
  const name = pillars.name(pillar)
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-[10px] leading-none font-semibold",
        open ? cn("border border-dashed bg-transparent", t.dashed, t.text) : cn(t.soft, t.text),
        className,
      )}
    >
      {pillars.letter(pillar)}
    </span>
  )
}

export function PillarDot({ pillar, className }: { pillar: Pillar | null; className?: string }) {
  const pillars = usePillars()
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", pillars.tone(pillar).dot, className)} />
}

/** Tinted chip with the pillar's name. */
export function PillarTag({ pillar, className }: { pillar: Pillar | null; className?: string }) {
  const pillars = usePillars()
  const t = pillars.tone(pillar)
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium", t.soft, t.border, t.text, className)}>
      <span className={cn("size-1.5 rounded-full", t.dot)} />
      {pillars.name(pillar)}
    </span>
  )
}

export function StatusPill({ status, className }: { status: PostStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium",
        status === "posted" && "bg-primary text-primary-foreground",
        status === "ready" && "border border-foreground/25 text-foreground",
        status === "draft" && "bg-muted text-foreground/70",
        status === "idea" && "border border-dashed border-muted-foreground/40 text-muted-foreground",
        className,
      )}
    >
      {status === "posted" && <CheckIcon className="size-3" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

export const STATUS_FILL: Record<PostStatus | "open", string> = {
  posted: "bg-status-posted",
  ready: "bg-status-ready",
  draft: "bg-status-draft",
  idea: "bg-status-idea",
  open: "bg-status-open",
}

export function PageHeader({
  chips,
  title,
  subtitle,
  actions,
}: {
  chips?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {chips && <div className="mb-2 flex flex-wrap gap-1.5">{chips}</div>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function MutedLink({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Arrow() {
  return <ArrowRightIcon className="size-3" />
}

export function Empty({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground", className)}>
      {children}
    </div>
  )
}

export function firstLine(text: string, fallback = "Untitled"): string {
  const line = text.split("\n").find((l) => l.trim())
  return line?.trim() || fallback
}

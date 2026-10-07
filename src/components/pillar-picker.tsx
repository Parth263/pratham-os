"use client"

import { PillarMark } from "@/components/kit"
import { usePillars } from "@/lib/pillars"
import type { Pillar } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Tinted pillar chips. Tap the selected one again to clear it. */
export function PillarPicker({ value, onChange, className }: { value: Pillar | null; onChange: (p: Pillar | null) => void; className?: string }) {
  const pillars = usePillars()
  return (
    <div role="radiogroup" aria-label="Pillar" className={cn("flex flex-wrap gap-1.5", className)}>
      {pillars.list.map((p) => {
        const on = value === p.id
        const t = pillars.tone(p.id)
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? null : p.id)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
              on ? cn(t.soft, t.border, t.text, "font-medium") : "border-border bg-card text-foreground/80 hover:bg-muted",
            )}
          >
            <PillarMark pillar={p.id} className={on ? "bg-card dark:bg-card" : undefined} />
            {p.name}
          </button>
        )
      })}
    </div>
  )
}

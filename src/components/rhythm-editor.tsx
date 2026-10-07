"use client"

import { PlusIcon, XIcon } from "lucide-react"
import { PillarMark } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { WEEKDAY_SHORT } from "@/lib/labels"
import { usePillars } from "@/lib/pillars"
import { RHYTHM_PRESETS, rhythmFromPreset } from "@/lib/seed"
import { uid, useApp } from "@/lib/store"
import type { Pillar } from "@/lib/types"
import { cn } from "@/lib/utils"

export function RhythmEditor() {
  const rhythm = useApp((s) => s.rhythm)
  const setRhythm = useApp((s) => s.setRhythm)
  const pillars = usePillars()

  const change = (id: string, pillar: Pillar) => setRhythm(rhythm.map((r) => (r.id === id ? { ...r, pillar } : r)))
  const remove = (id: string) => setRhythm(rhythm.filter((r) => r.id !== id))
  const add = (weekday: number) => {
    const first = pillars.list[0]
    if (!first) return
    const next = Math.max(-1, ...rhythm.filter((r) => r.weekday === weekday).map((r) => r.slotIndex)) + 1
    setRhythm([...rhythm, { id: uid(), weekday, slotIndex: next, pillar: first.id }])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Start from:</span>
        <Button variant="outline" size="sm" onClick={() => setRhythm(rhythmFromPreset(RHYTHM_PRESETS.daily, pillars.list))}>
          1 a day (7/week)
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRhythm(rhythmFromPreset(RHYTHM_PRESETS.stepUp, pillars.list))}>
          2 a day (14/week)
        </Button>
      </div>
      <div className="space-y-1.5">
        {WEEKDAY_SHORT.map((day, weekday) => {
          const slots = rhythm.filter((r) => r.weekday === weekday).sort((a, b) => a.slotIndex - b.slotIndex)
          return (
            <div key={day} className="flex items-center gap-2 rounded-lg bg-row px-2 py-1.5">
              <span className="w-9 shrink-0 pl-1 text-xs text-muted-foreground">{day}</span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {slots.map((r) => {
                  const t = pillars.tone(r.pillar)
                  return (
                    <div key={r.id} className={cn("flex items-center rounded-md border", t.soft, t.border)}>
                      <Select value={r.pillar} onValueChange={(v) => change(r.id, v)}>
                        <SelectTrigger size="sm" className={cn("h-7 gap-1.5 border-0 bg-transparent pr-1.5 pl-1.5 text-xs shadow-none dark:bg-transparent", t.text)}>
                          <PillarMark pillar={r.pillar} className="size-4 bg-card text-[9px] dark:bg-card" />
                          {pillars.name(r.pillar)}
                        </SelectTrigger>
                        <SelectContent>
                          {pillars.list.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <PillarMark pillar={p.id} className="size-4 text-[9px]" />
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button type="button" aria-label="Remove slot" className={cn("px-1.5 opacity-60 hover:opacity-100", t.text)} onClick={() => remove(r.id)}>
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  )
                })}
                {slots.length === 0 && <span className="py-1 text-xs text-muted-foreground">Rest day</span>}
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Add a slot on ${day}`} onClick={() => add(weekday)} disabled={!pillars.list.length}>
                <PlusIcon />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

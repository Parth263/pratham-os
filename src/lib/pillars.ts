"use client"

import { useMemo } from "react"
import { tone, type Tone } from "./colors"
import { useApp } from "./store"
import type { Pillar, PillarDef } from "./types"

export interface Pillars {
  /** in display order */
  list: PillarDef[]
  get: (id: Pillar | null | undefined) => PillarDef | undefined
  name: (id: Pillar | null | undefined) => string
  letter: (id: Pillar | null | undefined) => string
  tone: (id: Pillar | null | undefined) => Tone
}

export function usePillars(): Pillars {
  const pillars = useApp((s) => s.pillars)
  return useMemo(() => {
    const list = [...pillars].sort((a, b) => a.sortOrder - b.sortOrder)
    const byId = new Map(list.map((p) => [p.id, p]))
    const get = (id: Pillar | null | undefined) => (id ? byId.get(id) : undefined)
    return {
      list,
      get,
      name: (id) => get(id)?.name ?? "No pillar",
      letter: (id) => get(id)?.name.trim().charAt(0).toUpperCase() || "–",
      tone: (id) => tone(get(id)?.color),
    }
  }, [pillars])
}

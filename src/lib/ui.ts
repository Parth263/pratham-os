"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { create } from "zustand"
import { hourIST, todayIST } from "./dates"
import type { Post } from "./types"

interface UiState {
  /** nonce changes on every open, so the editor starts fresh each time */
  post: { open: boolean; id: string | null; prefill: Partial<Post> | null; nonce: number }
  settingsOpen: boolean
  helpOpen: boolean
  reviewOpen: boolean
  lead: { open: boolean; id: string | null; nonce: number }
  openPost: (id: string) => void
  newPost: (prefill?: Partial<Post>) => void
  closePost: () => void
  setSettingsOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  setReviewOpen: (open: boolean) => void
  openLead: (id: string | null) => void
  closeLead: () => void
}

export const useUi = create<UiState>()((set) => ({
  post: { open: false, id: null, prefill: null, nonce: 0 },
  settingsOpen: false,
  helpOpen: false,
  reviewOpen: false,
  lead: { open: false, id: null, nonce: 0 },
  openPost: (id) => set((s) => ({ post: { open: true, id, prefill: null, nonce: s.post.nonce + 1 } })),
  newPost: (prefill) => set((s) => ({ post: { open: true, id: null, prefill: prefill ?? {}, nonce: s.post.nonce + 1 } })),
  closePost: () => set((s) => ({ post: { ...s.post, open: false } })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setReviewOpen: (reviewOpen) => set({ reviewOpen }),
  openLead: (id) => set((s) => ({ lead: { open: true, id, nonce: s.lead.nonce + 1 } })),
  closeLead: () => set((s) => ({ lead: { ...s.lead, open: false } })),
}))

/** Today in IST. Re-checks every minute so the app rolls over at midnight. */
export function useToday() {
  const [state, setState] = useState(() => ({ today: todayIST(), hour: hourIST() }))
  useEffect(() => {
    const t = setInterval(() => {
      const next = { today: todayIST(), hour: hourIST() }
      setState((prev) => (prev.today === next.today && prev.hour === next.hour ? prev : next))
    }, 60_000)
    return () => clearInterval(t)
  }, [])
  return state
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

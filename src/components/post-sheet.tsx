"use client"

import { CopyIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { copyText, textFor, type Platform } from "@/components/copy-button"
import { DatePicker } from "@/components/date-picker"
import { firstLine, PillarMark } from "@/components/kit"
import { Field, ResponsiveSheet } from "@/components/responsive-sheet"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PILLAR_LABEL, PILLARS, STATUS_LABEL, STATUSES } from "@/lib/labels"
import { rhythmForDay } from "@/lib/slots"
import { blankPost, useApp } from "@/lib/store"
import type { Pillar, Post, PostStatus } from "@/lib/types"
import { useUi } from "@/lib/ui"

export function PostSheet() {
  const nonce = useUi((s) => s.post.nonce)
  return <PostEditor key={nonce} />
}

function PostEditor() {
  const ui = useUi((s) => s.post)
  const closePost = useUi((s) => s.closePost)
  const openPost = useUi((s) => s.openPost)
  const posts = useApp((s) => s.posts)
  const rhythm = useApp((s) => s.rhythm)
  const settings = useApp((s) => s.settings)
  const savePost = useApp((s) => s.savePost)
  const deletePost = useApp((s) => s.deletePost)

  const [p, setP] = useState<Post>(() => {
    const existing = ui.id ? posts.find((x) => x.id === ui.id) : undefined
    return existing ? { ...existing } : blankPost({ status: "draft", ...ui.prefill })
  })
  const set = (patch: Partial<Post>) => setP((prev) => ({ ...prev, ...patch }))
  const isNew = !posts.some((x) => x.id === p.id)

  const daySlots = p.date ? rhythmForDay(p.date, { rhythm, settings }) : []
  const takenBy = (slotIndex: number) => posts.find((x) => x.id !== p.id && x.date === p.date && x.slotIndex === slotIndex)
  const savedIdeas = posts.filter((x) => x.status === "idea" && !x.date && x.id !== p.id)

  function save() {
    if (!p.xText.trim() && !p.angle.trim()) {
      toast("Add an angle or a first line, then save.")
      return
    }
    savePost(p)
    toast(isNew ? "Post added" : "Saved")
    closePost()
  }

  function remove() {
    const copy = { ...p }
    deletePost(p.id)
    closePost()
    toast("Post deleted", { action: { label: "Undo", onClick: () => savePost(copy) } })
  }

  function recycle() {
    const fresh = blankPost({
      pillar: p.pillar,
      angle: p.angle ? `New angle: ${p.angle}` : "",
      xText: p.xText,
      linkedinText: p.linkedinText,
      visualNote: p.visualNote,
      visualUrl: p.visualUrl,
      sourceProofId: p.sourceProofId,
      status: "draft",
    })
    savePost(fresh)
    toast("Copied into a new draft")
    openPost(fresh.id)
  }

  function pickIdea(id: string) {
    const idea = posts.find((x) => x.id === id)
    if (!idea) return
    setP({ ...idea, date: p.date, slotIndex: p.slotIndex, pillar: idea.pillar ?? p.pillar, status: "draft" })
  }

  const xCount = p.xText.length
  const title = isNew ? "New post" : firstLine(p.xText || p.angle, "Edit post")

  return (
    <ResponsiveSheet
      open={ui.open}
      onOpenChange={(open) => !open && closePost()}
      title={<span className="line-clamp-1">{title}</span>}
      size="lg"
      footer={
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button variant="ghost" size="icon" aria-label="Delete post" onClick={remove} className="text-muted-foreground">
                <Trash2Icon />
              </Button>
              <Button variant="ghost" size="sm" onClick={recycle} className="text-muted-foreground">
                <RefreshCwIcon /> Recycle
              </Button>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9" disabled={!p.xText.trim()}>
                  <CopyIcon /> Copy
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["x", "linkedin"] as Platform[]).map((pl) => (
                  <DropdownMenuItem key={pl} onClick={() => copyText(textFor(p, pl), pl === "x" ? "Copied for X" : "Copied for LinkedIn")}>
                    {pl === "x" ? "Copy for X" : "Copy for LinkedIn"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="h-9 px-4" onClick={save}>
              Save
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="space-y-5"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            save()
          }
        }}
      >
        {isNew && p.date && savedIdeas.length > 0 && (
          <Select onValueChange={pickIdea}>
            <SelectTrigger className="w-full data-[size=default]:h-9">
              <SelectValue placeholder={`Or use a saved idea (${savedIdeas.length})`} />
            </SelectTrigger>
            <SelectContent>
              {savedIdeas.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  <span className="line-clamp-1">{firstLine(i.xText || i.angle)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Field label="Pillar">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={4}
            className="flex-wrap"
            value={p.pillar ?? ""}
            onValueChange={(v) => set({ pillar: (v || null) as Pillar | null })}
          >
            {PILLARS.map((pl) => (
              <ToggleGroupItem key={pl} value={pl} className="h-9 gap-2 px-3 data-[state=on]:border-foreground/40">
                <PillarMark pillar={pl} />
                {PILLAR_LABEL[pl]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field label="Angle" hint="The one point this post makes">
          <Input value={p.angle} onChange={(e) => set({ angle: e.target.value })} placeholder="e.g. Your hero needs proof, not a slogan" className="h-9" />
        </Field>

        <Field label="X" hint={<span className={xCount > 280 ? "text-foreground" : undefined}>{xCount}/280</span>}>
          <Textarea
            value={p.xText}
            onChange={(e) => set({ xText: e.target.value })}
            placeholder="Start with the line that makes a founder stop scrolling…"
            className="min-h-36 text-sm leading-relaxed"
            data-autofocus
          />
        </Field>

        <Field
          label="LinkedIn"
          hint={
            <button type="button" className="hover:text-foreground" onClick={() => set({ linkedinText: p.xText })} disabled={!p.xText}>
              Copy from X
            </button>
          }
        >
          <Textarea
            value={p.linkedinText}
            onChange={(e) => set({ linkedinText: e.target.value })}
            placeholder="Same idea, a little more context. Leave empty to reuse the X text."
            className="min-h-24 text-sm leading-relaxed"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Visual" hint="Every post gets one">
            <Input value={p.visualNote} onChange={(e) => set({ visualNote: e.target.value })} placeholder="What the image shows" className="h-9" />
          </Field>
          <Field label="Visual link">
            <Input value={p.visualUrl} onChange={(e) => set({ visualUrl: e.target.value })} placeholder="Figma, Framer, Drive…" className="h-9" />
          </Field>
        </div>

        <Field label="Status">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            className="w-full"
            value={p.status}
            onValueChange={(v) => v && set({ status: v as PostStatus })}
          >
            {STATUSES.map((st) => (
              <ToggleGroupItem key={st} value={st} className="h-9 flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {STATUS_LABEL[st]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <DatePicker value={p.date} onChange={(date) => set({ date, slotIndex: null })} placeholder="Not scheduled" />
          </Field>
          <Field label="Slot">
            <Select
              disabled={!p.date || daySlots.length === 0}
              value={p.slotIndex === null ? "auto" : String(p.slotIndex)}
              onValueChange={(v) => set({ slotIndex: v === "auto" ? null : Number(v) })}
            >
              <SelectTrigger className="w-full data-[size=default]:h-9">
                <SelectValue placeholder={p.date ? "No slots this day" : "Pick a date first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Pick for me</SelectItem>
                {daySlots.map((r) => {
                  const other = takenBy(r.slotIndex)
                  return (
                    <SelectItem key={r.slotIndex} value={String(r.slotIndex)} disabled={!!other}>
                      {PILLAR_LABEL[r.pillar]} slot{other ? " · taken" : ""}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <span>
            <span className="block text-sm">Call to action</span>
            <span className="block text-xs text-muted-foreground">This post asks people to book a call</span>
          </span>
          <Switch checked={p.isCta} onCheckedChange={(isCta) => set({ isCta })} />
        </label>

        {p.status === "posted" && (
          <div className="space-y-3 rounded-lg bg-row p-3">
            <p className="text-xs font-medium text-foreground/80">After posting</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={p.xUrl} onChange={(e) => set({ xUrl: e.target.value })} placeholder="X link" className="h-9 bg-card" />
              <Input value={p.linkedinUrl} onChange={(e) => set({ linkedinUrl: e.target.value })} placeholder="LinkedIn link" className="h-9 bg-card" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["likes", "Likes"],
                  ["replies", "Replies"],
                  ["dmsFrom", "DMs from it"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <Input
                    inputMode="numeric"
                    value={p[key] ?? ""}
                    onChange={(e) => {
                      const n = e.target.value.replace(/\D/g, "")
                      set({ [key]: n === "" ? null : Number(n) } as Partial<Post>)
                    }}
                    className="h-9 bg-card"
                  />
                </Field>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResponsiveSheet>
  )
}

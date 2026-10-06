"use client"

import { ExternalLinkIcon, PencilIcon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { DatePicker } from "@/components/date-picker"
import { Chip, Empty, PageHeader } from "@/components/kit"
import { Field, ResponsiveSheet } from "@/components/responsive-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fmt } from "@/lib/dates"
import { PROOF_KIND_LABEL, SEGMENT_LABEL, SEGMENTS } from "@/lib/labels"
import { useApp } from "@/lib/store"
import type { Proof, ProofKind, Segment } from "@/lib/types"
import { useUi } from "@/lib/ui"

type Draft = Omit<Proof, "id" | "createdAt" | "updatedAt">
const EMPTY: Draft = { title: "", client: "", segment: "agency", kind: "work", quote: "", metric: "", url: "", imageUrl: "", date: null }

export function ProofTab() {
  const proof = useApp((s) => s.proof)
  const newPost = useUi((s) => s.newPost)
  const [editing, setEditing] = useState<{ open: boolean; id: string | null; n: number }>({ open: false, id: null, n: 0 })
  const sorted = [...proof].sort((a, b) => (b.date ?? b.createdAt).localeCompare(a.date ?? a.createdAt))

  return (
    <div>
      <PageHeader
        chips={<Chip>{proof.length} items</Chip>}
        title="Proof"
        subtitle="Work, results and kind words. Posts that start from real work are the easiest to write and the easiest to trust."
        actions={
          <Button className="h-9" onClick={() => setEditing({ open: true, id: null, n: editing.n + 1 })}>
            <PlusIcon /> Add proof
          </Button>
        }
      />
      {sorted.length === 0 ? (
        <Empty>Nothing here yet. Add a project, a result or something kind a client said.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((p) => (
            <article key={p.id} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-1.5">
                <Chip>{PROOF_KIND_LABEL[p.kind]}</Chip>
                <Chip>{SEGMENT_LABEL[p.segment]}</Chip>
                {p.date && <span className="ml-auto text-xs text-muted-foreground">{fmt(p.date, "MMM yyyy")}</span>}
              </div>
              <h3 className="text-sm font-medium">{p.title}</h3>
              {p.client && <p className="text-xs text-muted-foreground">{p.client}</p>}
              {p.quote && <blockquote className="mt-3 border-l-2 pl-3 text-sm text-muted-foreground italic">{p.quote}</blockquote>}
              {p.metric && <p className="mt-3 text-sm font-medium">{p.metric}</p>}
              <div className="mt-auto flex items-center gap-1 pt-4">
                <Button variant="outline" size="sm" className="h-8" onClick={() => newPost({ pillar: "visual", angle: p.title, sourceProofId: p.id })}>
                  <SparklesIcon /> Turn into post
                </Button>
                {p.url && (
                  <Button variant="ghost" size="icon-sm" asChild className="text-muted-foreground">
                    <a href={p.url} target="_blank" rel="noreferrer" aria-label="Open link">
                      <ExternalLinkIcon />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Edit" className="ml-auto text-muted-foreground" onClick={() => setEditing({ open: true, id: p.id, n: editing.n + 1 })}>
                  <PencilIcon />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <ProofSheet key={editing.n} open={editing.open} id={editing.id} onClose={() => setEditing({ ...editing, open: false })} />
    </div>
  )
}

function ProofSheet({ open, id, onClose }: { open: boolean; id: string | null; onClose: () => void }) {
  const proof = useApp((s) => s.proof)
  const addItem = useApp((s) => s.addItem)
  const updateItem = useApp((s) => s.updateItem)
  const removeItem = useApp((s) => s.removeItem)
  const existing = id ? proof.find((p) => p.id === id) : undefined
  const [d, setD] = useState<Draft>(() => (existing ? { ...existing } : EMPTY))
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }))

  const save = () => {
    if (!d.title.trim()) {
      toast("Give it a title first.")
      return
    }
    if (existing) updateItem("proof", existing.id, d)
    else addItem("proof", d)
    toast(existing ? "Saved" : "Proof added")
    onClose()
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={existing ? "Edit proof" : "Add proof"}
      footer={
        <div className="flex items-center gap-2">
          {existing && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              className="text-muted-foreground"
              onClick={() => {
                removeItem("proof", existing.id)
                onClose()
                toast("Proof deleted")
              }}
            >
              <Trash2Icon />
            </Button>
          )}
          <Button className="ml-auto h-9 px-4" onClick={save}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Kind">
          <ToggleGroup type="single" variant="outline" spacing={0} className="w-full" value={d.kind} onValueChange={(v) => v && set({ kind: v as ProofKind })}>
            {(["work", "result", "testimonial"] as const).map((k) => (
              <ToggleGroupItem key={k} value={k} className="h-9 flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {PROOF_KIND_LABEL[k]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field label="Title">
          <Input data-autofocus value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Homepage for a Swiss studio" className="h-9" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client">
            <Input value={d.client} onChange={(e) => set({ client: e.target.value })} className="h-9" />
          </Field>
          <Field label="Date">
            <DatePicker value={d.date} onChange={(date) => set({ date })} />
          </Field>
        </div>
        <Field label="Segment">
          <ToggleGroup type="single" variant="outline" spacing={0} className="w-full" value={d.segment} onValueChange={(v) => v && set({ segment: v as Segment })}>
            {SEGMENTS.map((s) => (
              <ToggleGroupItem key={s} value={s} className="h-9 flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {SEGMENT_LABEL[s]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field label="Their words">
          <Textarea value={d.quote} onChange={(e) => set({ quote: e.target.value })} className="min-h-20" placeholder="A line from a message or review" />
        </Field>
        <Field label="Result" hint="A number if you have one">
          <Input value={d.metric} onChange={(e) => set({ metric: e.target.value })} className="h-9" placeholder="e.g. Launched in 9 days" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Link">
            <Input value={d.url} onChange={(e) => set({ url: e.target.value })} className="h-9" placeholder="https://" />
          </Field>
          <Field label="Image link">
            <Input value={d.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} className="h-9" placeholder="https://" />
          </Field>
        </div>
      </div>
    </ResponsiveSheet>
  )
}

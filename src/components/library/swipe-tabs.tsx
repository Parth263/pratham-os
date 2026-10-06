"use client"

import { PencilLineIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { CopyButton } from "@/components/copy-button"
import { EditableText } from "@/components/editable-text"
import { Chip, PageHeader } from "@/components/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SWIPE_KIND_LABEL } from "@/lib/labels"
import { useApp } from "@/lib/store"
import type { SwipeKind } from "@/lib/types"
import { useUi } from "@/lib/ui"

export function TemplatesTab() {
  const swipe = useApp((s) => s.swipe)
  const updateItem = useApp((s) => s.updateItem)
  const removeItem = useApp((s) => s.removeItem)
  const newPost = useUi((s) => s.newPost)
  const templates = swipe.filter((s) => s.kind === "template")

  return (
    <div>
      <PageHeader chips={<Chip>{templates.length} structures</Chip>} title="Templates" subtitle="Post structures for when the page is blank. Fill the {braces} with real work." />
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <article key={t.id} className="group flex flex-col rounded-xl border bg-card p-4">
            <div className="mb-1 flex items-center gap-2">
              <EditableText value={t.title} onSave={(title) => updateItem("swipe", t.id, { title })} className="font-medium" />
              <Button variant="ghost" size="icon-xs" aria-label="Remove" className="text-muted-foreground opacity-0 group-hover:opacity-100 max-md:opacity-100" onClick={() => removeItem("swipe", t.id)}>
                <XIcon />
              </Button>
            </div>
            <div className="flex-1 rounded-lg bg-row p-1">
              <EditableText value={t.body} onSave={(body) => updateItem("swipe", t.id, { body })} multiline className="font-mono text-xs text-muted-foreground" />
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" className="h-8" onClick={() => newPost({ xText: t.body, angle: "" })}>
                <PencilLineIcon /> Write
              </Button>
            </div>
          </article>
        ))}
      </div>
      <AddSwipe kind="template" />
    </div>
  )
}

export function SwipeTab() {
  const swipe = useApp((s) => s.swipe)
  const kinds: SwipeKind[] = ["hook", "dm_opener", "loom_opener", "cta"]
  const total = swipe.filter((s) => s.kind !== "template").length

  return (
    <div>
      <PageHeader chips={<Chip>{total} lines</Chip>} title="Swipe file" subtitle="Hooks, openers and calls to action. Copy, then make it yours." />
      <div className="space-y-8">
        {kinds.map((kind) => (
          <SwipeGroup key={kind} kind={kind} />
        ))}
      </div>
    </div>
  )
}

function SwipeGroup({ kind }: { kind: SwipeKind }) {
  const swipe = useApp((s) => s.swipe)
  const updateItem = useApp((s) => s.updateItem)
  const removeItem = useApp((s) => s.removeItem)
  const items = swipe.filter((s) => s.kind === kind)

  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-medium">
        {SWIPE_KIND_LABEL[kind]} <span className="ml-1 text-xs font-normal text-muted-foreground">{items.length}</span>
      </h2>
      <div className="space-y-1.5 rounded-xl border bg-card p-2">
        {items.map((i) => (
          <div key={i.id} className="group flex items-start gap-1 rounded-lg px-1 hover:bg-row">
            {kind !== "hook" && <span className="w-24 shrink-0 truncate pt-2 pl-1 text-xs text-muted-foreground">{i.title}</span>}
            <div className="min-w-0 flex-1">
              <EditableText value={i.body} onSave={(body) => (body ? updateItem("swipe", i.id, { body }) : removeItem("swipe", i.id))} multiline={kind !== "hook"} />
            </div>
            <div className="flex shrink-0 items-center pt-1">
              <CopyButton text={i.body} />
              <Button variant="ghost" size="icon-sm" aria-label="Remove" className="text-muted-foreground opacity-0 group-hover:opacity-100 max-md:opacity-100" onClick={() => removeItem("swipe", i.id)}>
                <XIcon />
              </Button>
            </div>
          </div>
        ))}
        <AddSwipe kind={kind} inline />
      </div>
    </section>
  )
}

function AddSwipe({ kind, inline }: { kind: SwipeKind; inline?: boolean }) {
  const addItem = useApp((s) => s.addItem)
  const [text, setText] = useState("")
  const isTemplate = kind === "template"
  return (
    <form
      className={inline ? undefined : "mt-4"}
      onSubmit={(e) => {
        e.preventDefault()
        const body = text.trim()
        if (!body) return
        addItem("swipe", { kind, title: isTemplate ? body : kind === "hook" ? "" : "New", body: isTemplate ? "{Line one}\n{Line two}" : body })
        setText("")
      }}
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isTemplate ? "Add a template by name…" : `Add to ${SWIPE_KIND_LABEL[kind].toLowerCase()}…`}
        className="h-9 border-dashed bg-transparent shadow-none"
      />
    </form>
  )
}

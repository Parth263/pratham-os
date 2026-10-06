"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/** Text that turns into a textarea on click and saves on blur or Enter. */
export function EditableText({
  value,
  onSave,
  placeholder = "Click to write…",
  className,
  multiline = false,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <Textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (draft.trim() !== value) onSave(draft.trim())
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(value)
            setEditing(false)
          }
          if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            ;(e.target as HTMLTextAreaElement).blur()
          }
        }}
        className={cn("min-h-0 resize-none bg-card px-2 py-1.5 text-sm leading-relaxed field-sizing-content", className)}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className={cn(
        "w-full rounded-md px-2 py-1.5 text-left text-sm leading-relaxed whitespace-pre-line transition-colors hover:bg-muted/60",
        !value && "text-muted-foreground",
        className,
      )}
    >
      {value || placeholder}
    </button>
  )
}

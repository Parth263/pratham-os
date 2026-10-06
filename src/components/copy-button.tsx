"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Platform = "x" | "linkedin"

export function textFor(post: { xText: string; linkedinText: string }, platform: Platform) {
  return platform === "linkedin" && post.linkedinText.trim() ? post.linkedinText : post.xText
}

export async function copyText(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text)
    toast(label)
    return true
  } catch {
    toast("Couldn't copy. Select the text and copy it by hand.")
    return false
  }
}

export function CopyButton({
  text,
  label,
  toastLabel,
  className,
  size = "icon-sm",
}: {
  text: string
  label?: string
  toastLabel?: string
  className?: string
  size?: "icon-sm" | "sm" | "icon"
}) {
  const [done, setDone] = useState(false)
  const Icon = done ? CheckIcon : CopyIcon
  return (
    <Button
      type="button"
      variant="ghost"
      size={label ? "sm" : size}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      disabled={!text.trim()}
      aria-label={label ?? "Copy"}
      onClick={async (e) => {
        e.stopPropagation()
        if (await copyText(text, toastLabel)) {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        }
      }}
    >
      <Icon />
      {label}
    </Button>
  )
}

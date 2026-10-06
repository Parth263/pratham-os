"use client"

import type * as React from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/lib/ui"
import { cn } from "@/lib/utils"

/** A right-hand sheet on desktop, a bottom sheet on phones. */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  size = "md",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  size?: "md" | "lg"
}) {
  const desktop = useMediaQuery("(min-width: 768px)")
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={desktop ? "right" : "bottom"}
        onOpenAutoFocus={(e) => {
          // Desktop: jump straight to the main field. Phone: don't pop the keyboard.
          e.preventDefault()
          const el = e.currentTarget as HTMLElement
          const target = desktop ? el.querySelector<HTMLElement>("[data-autofocus]") : null
          ;(target ?? el).focus({ preventScroll: true })
        }}
        className={cn(
          "gap-0 p-0",
          desktop
            ? cn("data-[side=right]:w-full", size === "lg" ? "data-[side=right]:sm:max-w-2xl" : "data-[side=right]:sm:max-w-lg")
            : "max-h-[92dvh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="border-b px-5 py-4 pr-12">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}

export function Field({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground/80">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

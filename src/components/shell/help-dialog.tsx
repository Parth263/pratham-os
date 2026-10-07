"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUi } from "@/lib/ui"

const STEPS = [
  ["Catch ideas", "Drop them in the box on Today. They wait in Library → My posts."],
  ["Fill your slots", "Calendar shows each day's open slots. Tap one to write into it."],
  ["Post and tick", "Copy for X or LinkedIn, post it, then tap Posted."],
  ["Ten warm DMs", "Tap +1 after each one. Leads with follow-ups live in Library → Pipeline."],
  ["Sunday review", "Five minutes on Sunday, then set next week's one goal."],
]

export function HelpDialog() {
  const open = useUi((s) => s.helpOpen)
  const setOpen = useUi((s) => s.setHelpOpen)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How Studio OS works</DialogTitle>
          <DialogDescription>Post daily, DM warmly, keep one goal. Everything else stays quiet.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-2">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3 rounded-lg bg-row px-3 py-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{i + 1}</span>
              <span className="text-sm">
                <span className="font-medium">{title}.</span> <span className="text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>
            Shortcuts: <kbd className="rounded border px-1">N</kbd> new post · <kbd className="rounded border px-1">⌘</kbd>
            <kbd className="rounded border px-1">↵</kbd> save a post
          </p>
          <p>Everything saves to your database and syncs between your phone and laptop. It keeps working offline and catches up when you&apos;re back.</p>
          <p>Layout inspired by Sofiane&apos;s post planner (@sofianedesign). Strategy shaped by Liutauras Liucvaikis (@liutauras_liu).</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

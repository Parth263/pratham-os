"use client"

import { CloudCheckIcon, CloudIcon, CloudOffIcon, HardDriveIcon, LoaderCircleIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { type SyncMode, useSync } from "@/lib/sync"
import { cn } from "@/lib/utils"

const VIEW: Record<SyncMode, { icon: typeof CloudIcon; label: string; hint: string; spin?: boolean }> = {
  starting: { icon: CloudIcon, label: "Connecting…", hint: "Loading your planner from the database." },
  synced: { icon: CloudCheckIcon, label: "Saved", hint: "Everything is saved and synced across your devices." },
  saving: { icon: LoaderCircleIcon, label: "Saving…", hint: "Sending your latest changes.", spin: true },
  offline: { icon: CloudOffIcon, label: "Offline", hint: "You can keep working. Changes sync when you're back online." },
  local: { icon: HardDriveIcon, label: "This device only", hint: "No database is connected, so changes stay in this browser." },
  error: { icon: CloudOffIcon, label: "Not syncing", hint: "The database didn't answer. Your changes are kept here and will retry." },
}

export function SyncStatus({ className }: { className?: string }) {
  const mode = useSync((s) => s.mode)
  const v = VIEW[mode]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="status"
          aria-label={v.label}
          className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground", className)}
        >
          <v.icon className={cn("size-4", v.spin && "animate-spin")} />
          <span className="max-lg:hidden">{v.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{v.hint}</TooltipContent>
    </Tooltip>
  )
}

"use client"

import { format, parseISO } from "date-fns"
import { CalendarIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Day } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DatePicker({
  value,
  onChange,
  placeholder = "No date",
  clearable = true,
  className,
}: {
  value: Day | null
  onChange: (d: Day | null) => void
  placeholder?: string
  clearable?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className={cn("h-9 flex-1 justify-start font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon />
            {value ? format(parseISO(value), "EEE, d MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            weekStartsOn={1}
            selected={value ? parseISO(value) : undefined}
            defaultMonth={value ? parseISO(value) : undefined}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : null)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && (
        <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Clear date" onClick={() => onChange(null)}>
          <XIcon />
        </Button>
      )}
    </div>
  )
}

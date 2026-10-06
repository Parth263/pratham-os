"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Field, ResponsiveSheet } from "@/components/responsive-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { addDaysTo, fmt, monthEndOf, monthStartOf, weekStartOf } from "@/lib/dates"
import { weekPipelineStats } from "@/lib/pipeline"
import { rangeStats } from "@/lib/slots"
import { useApp } from "@/lib/store"
import { threeScore } from "@/lib/streaks"
import type { ReviewSnapshot } from "@/lib/types"
import { useToday, useUi } from "@/lib/ui"

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`

export function ReviewSheet() {
  const open = useUi((s) => s.reviewOpen)
  const setOpen = useUi((s) => s.setReviewOpen)
  const { today } = useToday()
  // Remount per open so the form starts from the saved review.
  const [session, setSession] = useState(0)
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSession((n) => n + 1)
      }}
      title="Sunday review"
      description={`Week of ${fmt(weekStartOf(today), "d MMMM")}. Five minutes, then one goal for next week.`}
    >
      <ReviewForm key={session} today={today} onDone={() => setOpen(false)} />
    </ResponsiveSheet>
  )
}

function ReviewForm({ today, onDone }: { today: string; onDone: () => void }) {
  const weekStart = weekStartOf(today)
  const posts = useApp((s) => s.posts)
  const rhythm = useApp((s) => s.rhythm)
  const settings = useApp((s) => s.settings)
  const leads = useApp((s) => s.leads)
  const touches = useApp((s) => s.touches)
  const dayLogs = useApp((s) => s.dayLogs)
  const revenue = useApp((s) => s.revenue)
  const reviews = useApp((s) => s.reviews)
  const saveReview = useApp((s) => s.saveReview)
  const addItem = useApp((s) => s.addItem)
  const existing = reviews.find((r) => r.weekStart === weekStart)

  const [worked, setWorked] = useState(existing?.worked ?? "")
  const [didnt, setDidnt] = useState(existing?.didnt ?? "")
  const [nextGoal, setNextGoal] = useState(existing?.nextGoal ?? "")
  const [income, setIncome] = useState({ amount: "", note: "" })

  const snap: ReviewSnapshot = useMemo(() => {
    const end = addDaysTo(weekStart, 6)
    const ctx = { rhythm, posts, settings, today }
    const week = rangeStats(weekStart, end, ctx)
    const pipe = weekPipelineStats(weekStart, today, leads, touches)
    const three = threeScore(weekStart, { ...ctx, touches, dayLogs, dmTarget: settings.dmTarget })
    return {
      posted: week.byStatus.posted,
      slots: week.total,
      dms: pipe.dms,
      replies: pipe.replies,
      calls: pipe.calls,
      won: pipe.won,
      revenueUsd: revenue.filter((r) => r.date >= weekStart && r.date <= end).reduce((n, r) => n + r.amountUsd, 0),
      threeScore: Math.round((three.done / three.total) * 100),
      runwayMonths: settings.floorInr ? Math.round((settings.cashOnHandInr / settings.floorInr) * 10) / 10 : 0,
    }
  }, [weekStart, today, rhythm, posts, settings, leads, touches, dayLogs, revenue])

  const monthInr =
    revenue.filter((r) => r.date >= monthStartOf(today) && r.date <= monthEndOf(today)).reduce((n, r) => n + r.amountUsd, 0) * settings.usdInrRate

  const numbers: [string, React.ReactNode][] = [
    ["Posts published", <>{snap.posted}<span className="text-muted-foreground">/{snap.slots}</span></>],
    ["Warm DMs", snap.dms],
    ["Replies", snap.replies],
    ["Calls booked", snap.calls],
    ["Deals won", snap.won],
    ["Revenue", `$${snap.revenueUsd.toLocaleString("en-US")}`],
    ["Today's three", `${snap.threeScore}%`],
    ["Runway", `${snap.runwayMonths} mo`],
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {numbers.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-row px-3 py-2.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        This month: {inr(monthInr)} of your {inr(settings.floorInr)} floor. Runway is cash on hand ({inr(settings.cashOnHandInr)}) ÷ the floor; edit both in Settings.
      </p>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const amountUsd = Number(income.amount)
          if (!amountUsd) return
          addItem("revenue", { date: today, amountUsd, note: income.note.trim() })
          setIncome({ amount: "", note: "" })
          toast("Income added")
        }}
      >
        <Field label="Add income (USD)" className="w-36">
          <Input inputMode="decimal" value={income.amount} onChange={(e) => setIncome({ ...income, amount: e.target.value.replace(/[^\d.]/g, "") })} className="h-9" />
        </Field>
        <Field label="From" className="flex-1">
          <Input value={income.note} onChange={(e) => setIncome({ ...income, note: e.target.value })} placeholder="Client or template" className="h-9" />
        </Field>
        <Button type="submit" variant="outline" className="h-9" disabled={!Number(income.amount)}>
          Add
        </Button>
      </form>

      <Field label="What worked?">
        <Textarea value={worked} onChange={(e) => setWorked(e.target.value)} className="min-h-20" />
      </Field>
      <Field label="What didn't?">
        <Textarea value={didnt} onChange={(e) => setDidnt(e.target.value)} className="min-h-20" />
      </Field>
      <Field label="Next week's one goal">
        <Input value={nextGoal} onChange={(e) => setNextGoal(e.target.value)} placeholder="Just one." className="h-9" />
      </Field>

      <Button
        className="h-9 w-full"
        onClick={() => {
          saveReview({ weekStart, snapshot: snap, worked: worked.trim(), didnt: didnt.trim(), nextGoal: nextGoal.trim() })
          toast(nextGoal.trim() ? "Review saved. Next week's goal is set." : "Review saved.")
          onDone()
        }}
      >
        Save review
      </Button>
    </div>
  )
}

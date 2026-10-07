"use client"

import { ArrowRightIcon, DownloadIcon, LogOutIcon, UploadIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { DatePicker } from "@/components/date-picker"
import { Field, ResponsiveSheet } from "@/components/responsive-sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fmt, todayIST } from "@/lib/dates"
import { MAKE_KIND_LABEL } from "@/lib/labels"
import { logout } from "@/app/login/actions"
import { snapshot, useApp } from "@/lib/store"
import { useSync } from "@/lib/sync"
import type { AppData, MakeKind } from "@/lib/types"
import { useUi } from "@/lib/ui"
import { cn } from "@/lib/utils"

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function NumberInput({ value, onChange, className }: { value: number; onChange: (n: number) => void; className?: string }) {
  return (
    <Input
      inputMode="decimal"
      value={Number.isFinite(value) ? String(value) : ""}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/[^\d.]/g, ""))
        onChange(Number.isFinite(n) ? n : 0)
      }}
      className={cn("h-9", className)}
    />
  )
}

export function SettingsSheet({ authEnabled }: { authEnabled: boolean }) {
  const open = useUi((s) => s.settingsOpen)
  const setOpen = useUi((s) => s.setSettingsOpen)
  return (
    <ResponsiveSheet open={open} onOpenChange={setOpen} title="Settings" description="Changes save as you go.">
      <div className="space-y-6">
        <PillarsLink />
        <PlanSettings />
        <MakeLists />
        <Appearance />
        <DataSettings authEnabled={authEnabled} />
        <History />
      </div>
    </ResponsiveSheet>
  )
}

function PillarsLink() {
  const router = useRouter()
  const setOpen = useUi((s) => s.setSettingsOpen)
  return (
    <Section title="Pillars & rhythm" hint="Name, colour and order your pillars, and set how many posts a week. Both live in the Playbook.">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(false)
          router.push("/playbook#pillars")
        }}
      >
        Edit in Playbook <ArrowRightIcon />
      </Button>
    </Section>
  )
}

function PlanSettings() {
  const s = useApp((st) => st.settings)
  const update = useApp((st) => st.updateSettings)
  return (
    <>
      <Section title="Daily">
        <Field label="Warm DMs per day">
          <NumberInput value={s.dmTarget} onChange={(dmTarget) => update({ dmTarget: Math.max(1, Math.round(dmTarget)) })} className="w-28" />
        </Field>
      </Section>
      <Section title="The run" hint="Day N of the run and every streak start here.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Starts">
            <DatePicker value={s.runStart} onChange={(d) => d && update({ runStart: d })} clearable={false} />
          </Field>
          <Field label="Ends">
            <DatePicker value={s.runEnd} onChange={(d) => d && update({ runEnd: d })} clearable={false} />
          </Field>
        </div>
        <Field label="6-month goal">
          <Textarea value={s.sixMonthGoal} onChange={(e) => update({ sixMonthGoal: e.target.value })} className="min-h-16" />
        </Field>
        <Field label="This month's goal">
          <Input value={s.monthlyGoal} onChange={(e) => update({ monthlyGoal: e.target.value })} className="h-9" />
        </Field>
      </Section>
      <Section title="Offer">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Current price (USD)">
            <NumberInput value={s.currentPriceUsd} onChange={(currentPriceUsd) => update({ currentPriceUsd })} />
          </Field>
          <Field label="Cal.com link">
            <Input value={s.calLink} onChange={(e) => update({ calLink: e.target.value })} className="h-9" />
          </Field>
        </div>
      </Section>
      <Section title="Money" hint="Used for runway in the Sunday review.">
        <div className="grid grid-cols-3 gap-3">
          <Field label="USD → INR">
            <NumberInput value={s.usdInrRate} onChange={(usdInrRate) => update({ usdInrRate })} />
          </Field>
          <Field label="Cash on hand (₹)">
            <NumberInput value={s.cashOnHandInr} onChange={(cashOnHandInr) => update({ cashOnHandInr })} />
          </Field>
          <Field label="Monthly floor (₹)">
            <NumberInput value={s.floorInr} onChange={(floorInr) => update({ floorInr })} />
          </Field>
        </div>
      </Section>
    </>
  )
}

function MakeLists() {
  const make = useApp((s) => s.make)
  const addItem = useApp((s) => s.addItem)
  const updateItem = useApp((s) => s.updateItem)
  const removeItem = useApp((s) => s.removeItem)
  const [drafts, setDrafts] = useState<Record<MakeKind, string>>({ client: "", branding: "", template: "" })

  return (
    <Section title="Make" hint="Your focus block is picked from these: client work first, then branding, then templates.">
      {(["client", "branding", "template"] as const).map((kind) => {
        const items = make.filter((m) => m.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder)
        return (
          <div key={kind} className="space-y-1.5">
            <p className="text-xs font-medium text-foreground/80">{MAKE_KIND_LABEL[kind]}</p>
            {items.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg bg-row py-1 pr-1 pl-3">
                <Checkbox checked={m.done} onCheckedChange={(v) => updateItem("make", m.id, { done: v === true })} aria-label="Done" className="rounded-full" />
                <Input
                  value={m.title}
                  onChange={(e) => updateItem("make", m.id, { title: e.target.value })}
                  className={cn("h-8 flex-1 border-0 bg-transparent px-1 shadow-none dark:bg-transparent", m.done && "text-muted-foreground line-through")}
                />
                {kind === "client" && (
                  <DatePicker value={m.dueDate} onChange={(dueDate) => updateItem("make", m.id, { dueDate })} placeholder="Due" className="w-40 [&_button]:h-8" />
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => removeItem("make", m.id)} className="text-muted-foreground">
                  <XIcon />
                </Button>
              </div>
            ))}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const title = drafts[kind].trim()
                if (!title) return
                addItem("make", { kind, title, dueDate: null, done: false, sortOrder: items.length })
                setDrafts({ ...drafts, [kind]: "" })
              }}
            >
              <Input value={drafts[kind]} onChange={(e) => setDrafts({ ...drafts, [kind]: e.target.value })} placeholder="Add one…" className="h-8" />
              <Button type="submit" variant="outline" size="sm" className="h-8" disabled={!drafts[kind].trim()}>
                Add
              </Button>
            </form>
          </div>
        )
      })}
    </Section>
  )
}

function Appearance() {
  const { theme, setTheme } = useTheme()
  return (
    <Section title="Appearance">
      <ToggleGroup type="single" variant="outline" spacing={0} value={theme ?? "light"} onValueChange={(v) => v && setTheme(v)}>
        {["light", "dark", "system"].map((t) => (
          <ToggleGroupItem key={t} value={t} className="h-8 px-4 text-xs capitalize">
            {t}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Section>
  )
}

function DataSettings({ authEnabled }: { authEnabled: boolean }) {
  const syncMode = useSync((s) => s.mode)
  const removeSamples = useApp((s) => s.removeSamples)
  const importData = useApp((s) => s.importData)
  const resetAll = useApp((s) => s.resetAll)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `studio-os-${todayIST()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Section
      title="Your data"
      hint={
        syncMode === "local"
          ? "No database is connected, so everything stays in this browser. Export a backup now and then."
          : "Saved to your database and synced across your devices. A JSON export is a handy extra backup."
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={exportJson}>
          <DownloadIcon /> Export JSON
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <UploadIcon /> Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            try {
              const data = JSON.parse(await file.text()) as AppData
              if (![1, 2].includes(Number(data.version)) || !Array.isArray(data.posts)) throw new Error("bad file")
              importData(data)
              toast("Backup imported")
            } catch {
              toast("That file doesn't look like a Studio OS backup.")
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            removeSamples()
            toast("Samples removed")
          }}
        >
          Remove sample data
        </Button>
        {authEnabled && (
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOutIcon /> Sign out
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Start over
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start over?</AlertDialogTitle>
              <AlertDialogDescription>This clears everything, on every synced device, and loads the starting content again. Export a backup first if you want to keep anything.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my data</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  resetAll()
                  toast("Fresh start loaded")
                }}
              >
                Start over
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Section>
  )
}

function History() {
  const reviews = useApp((s) => s.reviews)
  const sorted = [...reviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  return (
    <Section title="History" hint="Your Sunday reviews.">
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reviews yet. The first one shows up on Sunday.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <details key={r.id} className="rounded-lg bg-row px-3 py-2.5 text-sm">
              <summary className="cursor-pointer list-none">
                <span className="font-medium">Week of {fmt(r.weekStart, "d MMM")}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {r.snapshot.posted}/{r.snapshot.slots} posts · {r.snapshot.dms} DMs · {r.snapshot.threeScore}%
                </span>
              </summary>
              <dl className="mt-2 space-y-1.5 text-xs">
                {r.worked && (
                  <div>
                    <dt className="text-muted-foreground">What worked</dt>
                    <dd className="whitespace-pre-line">{r.worked}</dd>
                  </div>
                )}
                {r.didnt && (
                  <div>
                    <dt className="text-muted-foreground">What didn&apos;t</dt>
                    <dd className="whitespace-pre-line">{r.didnt}</dd>
                  </div>
                )}
                {r.nextGoal && (
                  <div>
                    <dt className="text-muted-foreground">Next week&apos;s goal</dt>
                    <dd>{r.nextGoal}</dd>
                  </div>
                )}
              </dl>
            </details>
          ))}
        </div>
      )}
    </Section>
  )
}

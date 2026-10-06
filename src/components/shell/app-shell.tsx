"use client"

import {
  BookOpenIcon,
  CalendarDaysIcon,
  CircleHelpIcon,
  LibraryIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SunIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { HelpDialog } from "@/components/shell/help-dialog"
import { LeadSheet } from "@/components/library/lead-sheet"
import { PostSheet } from "@/components/post-sheet"
import { ReviewSheet } from "@/components/review-sheet"
import { SettingsSheet } from "@/components/shell/settings-sheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useApp } from "@/lib/store"
import { useUi } from "@/lib/ui"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Today", icon: SunIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/playbook", label: "Playbook", icon: BookOpenIcon },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
}

export function Logo() {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden>
        <rect x="2" y="2" width="5" height="5" rx="1.2" />
        <rect x="9" y="2" width="5" height="5" rx="2.5" />
        <rect x="2" y="9" width="5" height="5" rx="2.5" />
        <rect x="9" y="9" width="5" height="5" rx="1.2" />
      </svg>
    </span>
  )
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const done = () => {
      useApp.getState().seedIfEmpty()
      setHydrated(true)
    }
    const unsub = useApp.persist.onFinishHydration(done)
    void useApp.persist.rehydrate()
    if (useApp.persist.hasHydrated()) done()
    return unsub
  }, [])
  return hydrated
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const isActive = useActive()
  const newPost = useUi((s) => s.newPost)
  const setHelpOpen = useUi((s) => s.setHelpOpen)
  const setSettingsOpen = useUi((s) => s.setSettingsOpen)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest("input, textarea, select, [contenteditable], [role=dialog]")) return
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        useUi.getState().newPost()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="min-h-dvh md:p-4 lg:p-6">
      <div className="mx-auto flex min-h-dvh max-w-[1100px] flex-col bg-surface md:min-h-[calc(100dvh-2rem)] md:rounded-2xl md:border md:shadow-sm lg:min-h-[calc(100dvh-3rem)]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-surface/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:static md:h-16 md:rounded-t-2xl md:border-b-0 md:bg-transparent md:px-6 md:backdrop-blur-none">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-medium">Studio OS</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
                  isActive(href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1 md:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help" onClick={() => setHelpOpen(true)} className="text-muted-foreground">
                  <CircleHelpIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => setSettingsOpen(true)} className="text-muted-foreground">
                  <SlidersHorizontalIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            <Button className="ml-2 h-9 px-3" onClick={() => newPost()}>
              <PlusIcon /> New post
            </Button>
          </div>

          <div className="ml-auto md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-10" aria-label="Menu">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setHelpOpen(true)}>
                  <CircleHelpIcon /> Help
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <SlidersHorizontalIcon /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                  <SunIcon /> {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 pt-5 pb-28 sm:px-6 md:px-10 md:pt-6 md:pb-12">
          {hydrated ? children : null}
        </main>
      </div>

      {/* Mobile: bottom tabs with a raised new-post button in the middle */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {[...NAV.slice(0, 2), null, ...NAV.slice(2)].map((item) =>
          item ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                isActive(item.href) ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ) : (
            <div key="new" className="flex h-14 items-center justify-center">
              <button
                type="button"
                onClick={() => newPost()}
                aria-label="New post"
                className="-mt-6 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-surface active:scale-95"
              >
                <PlusIcon className="size-6" />
              </button>
            </div>
          ),
        )}
      </nav>

      {hydrated && (
        <>
          <PostSheet />
          <SettingsSheet />
          <ReviewSheet />
          <LeadSheet />
          <HelpDialog />
        </>
      )}
    </div>
  )
}

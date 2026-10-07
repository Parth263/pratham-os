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

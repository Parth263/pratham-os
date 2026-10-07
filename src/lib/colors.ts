/**
 * Light accent colours. One colour per category, never shared.
 *
 * The six defaults (violet, sky, amber, pink, lime, teal) were picked by searching
 * every Tailwind hue for the most distinct set: worst pair ΔE 17.3 for normal vision
 * and 9.2 under red-green colour blindness, in light and dark. A name or letter is
 * always shown next to a colour, so colour is never the only cue.
 *
 * Class strings are written out in full so Tailwind can see them.
 */

export type ColorKey = "violet" | "sky" | "amber" | "pink" | "lime" | "teal" | "red" | "indigo" | "orange" | "emerald"

export interface Tone {
  /** solid dot / bar */
  dot: string
  /** soft tinted background */
  soft: string
  /** a slightly stronger tint for hover */
  softHover: string
  /** tinted border */
  border: string
  /** dashed border for "open" marks */
  dashed: string
  /** readable text on the soft background */
  text: string
  label: string
}

export const TONES: Record<ColorKey, Tone> = {
  violet: {
    dot: "bg-violet-600",
    soft: "bg-violet-50 dark:bg-violet-500/15",
    softHover: "hover:bg-violet-100 dark:hover:bg-violet-500/25",
    border: "border-violet-200 dark:border-violet-500/35",
    dashed: "border-violet-400 dark:border-violet-400/70",
    text: "text-violet-700 dark:text-violet-300",
    label: "Violet",
  },
  sky: {
    dot: "bg-sky-600",
    soft: "bg-sky-50 dark:bg-sky-500/15",
    softHover: "hover:bg-sky-100 dark:hover:bg-sky-500/25",
    border: "border-sky-200 dark:border-sky-500/35",
    dashed: "border-sky-400 dark:border-sky-400/70",
    text: "text-sky-700 dark:text-sky-300",
    label: "Sky",
  },
  amber: {
    dot: "bg-amber-600",
    soft: "bg-amber-50 dark:bg-amber-500/15",
    softHover: "hover:bg-amber-100 dark:hover:bg-amber-500/25",
    border: "border-amber-200 dark:border-amber-500/35",
    dashed: "border-amber-400 dark:border-amber-400/70",
    text: "text-amber-800 dark:text-amber-300",
    label: "Amber",
  },
  pink: {
    dot: "bg-pink-600",
    soft: "bg-pink-50 dark:bg-pink-500/15",
    softHover: "hover:bg-pink-100 dark:hover:bg-pink-500/25",
    border: "border-pink-200 dark:border-pink-500/35",
    dashed: "border-pink-400 dark:border-pink-400/70",
    text: "text-pink-700 dark:text-pink-300",
    label: "Pink",
  },
  lime: {
    dot: "bg-lime-500",
    soft: "bg-lime-50 dark:bg-lime-500/15",
    softHover: "hover:bg-lime-100 dark:hover:bg-lime-500/25",
    border: "border-lime-300 dark:border-lime-500/35",
    dashed: "border-lime-500 dark:border-lime-400/70",
    text: "text-lime-800 dark:text-lime-300",
    label: "Lime",
  },
  teal: {
    dot: "bg-teal-500",
    soft: "bg-teal-50 dark:bg-teal-500/15",
    softHover: "hover:bg-teal-100 dark:hover:bg-teal-500/25",
    border: "border-teal-200 dark:border-teal-500/35",
    dashed: "border-teal-400 dark:border-teal-400/70",
    text: "text-teal-700 dark:text-teal-300",
    label: "Teal",
  },
  red: {
    dot: "bg-red-600",
    soft: "bg-red-50 dark:bg-red-500/15",
    softHover: "hover:bg-red-100 dark:hover:bg-red-500/25",
    border: "border-red-200 dark:border-red-500/35",
    dashed: "border-red-400 dark:border-red-400/70",
    text: "text-red-700 dark:text-red-300",
    label: "Red",
  },
  indigo: {
    dot: "bg-indigo-600",
    soft: "bg-indigo-50 dark:bg-indigo-500/15",
    softHover: "hover:bg-indigo-100 dark:hover:bg-indigo-500/25",
    border: "border-indigo-200 dark:border-indigo-500/35",
    dashed: "border-indigo-400 dark:border-indigo-400/70",
    text: "text-indigo-700 dark:text-indigo-300",
    label: "Indigo",
  },
  orange: {
    dot: "bg-orange-500",
    soft: "bg-orange-50 dark:bg-orange-500/15",
    softHover: "hover:bg-orange-100 dark:hover:bg-orange-500/25",
    border: "border-orange-200 dark:border-orange-500/35",
    dashed: "border-orange-400 dark:border-orange-400/70",
    text: "text-orange-700 dark:text-orange-300",
    label: "Orange",
  },
  emerald: {
    dot: "bg-emerald-600",
    soft: "bg-emerald-50 dark:bg-emerald-500/15",
    softHover: "hover:bg-emerald-100 dark:hover:bg-emerald-500/25",
    border: "border-emerald-200 dark:border-emerald-500/35",
    dashed: "border-emerald-400 dark:border-emerald-400/70",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Emerald",
  },
}

/** Colours a pillar can take. Lime and teal are kept for the daily areas. */
export const PILLAR_SWATCHES: ColorKey[] = ["violet", "sky", "amber", "pink", "red", "indigo", "orange", "emerald"]

/** The three daily areas. Post takes the colour of today's pillar. */
export const AREA_COLOR = { outreach: "lime", make: "teal" } as const satisfies Record<string, ColorKey>

export const NEUTRAL_TONE: Tone = {
  dot: "bg-muted-foreground/50",
  soft: "bg-muted",
  softHover: "hover:bg-muted",
  border: "border-border",
  dashed: "border-muted-foreground/40",
  text: "text-muted-foreground",
  label: "None",
}

export function tone(key: ColorKey | null | undefined): Tone {
  return key ? (TONES[key] ?? NEUTRAL_TONE) : NEUTRAL_TONE
}

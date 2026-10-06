/** A calendar day in IST, "yyyy-MM-dd". */
export type Day = string

export type Pillar = "visual" | "educational" | "business" | "personal"
export type PostStatus = "idea" | "draft" | "ready" | "posted"
export type Segment = "agency" | "ai_startup" | "other"
export type LeadStage =
  | "found"
  | "contacted"
  | "replied"
  | "call_booked"
  | "proposal"
  | "won"
  | "lost"
export type Channel = "x" | "linkedin" | "email" | "other"
export type AudienceKind = "problem" | "question" | "objection"
export type ProofKind = "work" | "result" | "testimonial"
export type SwipeKind = "hook" | "dm_opener" | "loom_opener" | "cta" | "template"
export type MakeKind = "client" | "branding" | "template"

interface Base {
  id: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
  runStart: Day
  runEnd: Day
  sixMonthGoal: string
  monthlyGoal: string
  dmTarget: number
  currentPriceUsd: number
  calLink: string
  usdInrRate: number
  cashOnHandInr: number
  floorInr: number
}

export interface Playbook {
  strategy: string
  summary: string
  pillars: Record<Pillar, { definition: string; why: string }>
  rules: string[]
  /** written at the day-30 niche check */
  nicheDecision: string
}

export interface RhythmSlot {
  id: string
  /** 0 = Monday … 6 = Sunday */
  weekday: number
  slotIndex: number
  pillar: Pillar
}

export interface Post extends Base {
  pillar: Pillar | null
  angle: string
  xText: string
  linkedinText: string
  visualNote: string
  visualUrl: string
  status: PostStatus
  date: Day | null
  slotIndex: number | null
  postedAt: string | null
  xUrl: string
  linkedinUrl: string
  likes: number | null
  replies: number | null
  dmsFrom: number | null
  isCta: boolean
  sourceProofId: string | null
  groupId: string | null
  isSample: boolean
}

export interface AudienceLine extends Base {
  kind: AudienceKind
  /** null = applies to both segments */
  segment: Segment | null
  text: string
}

export interface Prompt extends Base {
  pillar: Pillar
  /** null = one of the pillar's example ideas */
  angle: string | null
  text: string
}

export interface Proof extends Base {
  title: string
  client: string
  segment: Segment
  kind: ProofKind
  quote: string
  metric: string
  url: string
  imageUrl: string
  date: Day | null
}

export interface SwipeItem extends Base {
  kind: SwipeKind
  title: string
  body: string
}

export interface Lead extends Base {
  name: string
  company: string
  url: string
  segment: Segment
  channel: Channel
  stage: LeadStage
  lastTouchAt: string | null
  nextFollowUpAt: Day | null
  dealValueUsd: number | null
  notes: string
  contactedAt: Day | null
  repliedAt: Day | null
  callBookedAt: Day | null
  closedAt: Day | null
  isSample: boolean
}

export interface Touch extends Base {
  leadId: string | null
  date: Day
  channel: Channel
  segment: Segment | null
}

export interface DayLog {
  date: Day
  focusDone: boolean
  /** id of a MakeItem chosen with "change" */
  focusRef: string | null
}

export interface WeeklyGoal {
  weekStart: Day
  title: string
  done: boolean
  checks: string[]
}

export interface MakeItem extends Base {
  kind: MakeKind
  title: string
  dueDate: Day | null
  done: boolean
  sortOrder: number
}

export interface Revenue extends Base {
  date: Day
  amountUsd: number
  note: string
}

export interface ReviewSnapshot {
  posted: number
  slots: number
  dms: number
  replies: number
  calls: number
  won: number
  revenueUsd: number
  threeScore: number
  runwayMonths: number
}

export interface WeeklyReview extends Base {
  weekStart: Day
  snapshot: ReviewSnapshot
  worked: string
  didnt: string
  nextGoal: string
}

export interface AppData {
  version: 1
  seeded: boolean
  settings: Settings
  playbook: Playbook
  rhythm: RhythmSlot[]
  posts: Post[]
  audience: AudienceLine[]
  idealClients: Record<"agency" | "ai_startup", string>
  prompts: Prompt[]
  proof: Proof[]
  swipe: SwipeItem[]
  leads: Lead[]
  touches: Touch[]
  dayLogs: Record<Day, DayLog>
  weeklyGoals: Record<Day, WeeklyGoal>
  make: MakeItem[]
  revenue: Revenue[]
  reviews: WeeklyReview[]
}

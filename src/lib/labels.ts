import type {
  AudienceKind,
  Channel,
  LeadStage,
  MakeKind,
  PostStatus,
  ProofKind,
  Segment,
  SwipeKind,
} from "./types"

export const STATUSES: PostStatus[] = ["idea", "draft", "ready", "posted"]

export const STATUS_LABEL: Record<PostStatus, string> = {
  idea: "Idea",
  draft: "Draft",
  ready: "Ready",
  posted: "Posted",
}

export const SEGMENTS: Segment[] = ["agency", "ai_startup", "other"]

export const SEGMENT_LABEL: Record<Segment, string> = {
  agency: "Agency",
  ai_startup: "AI startup",
  other: "Other",
}

export const STAGES: LeadStage[] = [
  "found",
  "contacted",
  "replied",
  "call_booked",
  "proposal",
  "won",
  "lost",
]

export const STAGE_LABEL: Record<LeadStage, string> = {
  found: "Found",
  contacted: "Contacted",
  replied: "Replied",
  call_booked: "Call booked",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
}

export const CHANNELS: Channel[] = ["x", "linkedin", "email", "other"]

export const CHANNEL_LABEL: Record<Channel, string> = {
  x: "X",
  linkedin: "LinkedIn",
  email: "Email",
  other: "Other",
}

export const AUDIENCE_LABEL: Record<AudienceKind, { title: string; hint: string }> = {
  problem: { title: "Problems", hint: "What they struggle with" },
  question: { title: "Questions", hint: "What they ask on calls" },
  objection: { title: "Objections", hint: "What stops them hiring" },
}

export const PROOF_KIND_LABEL: Record<ProofKind, string> = {
  work: "Work",
  result: "Result",
  testimonial: "Testimonial",
}

export const SWIPE_KIND_LABEL: Record<SwipeKind, string> = {
  hook: "Hooks",
  dm_opener: "DM openers",
  loom_opener: "Loom openers",
  cta: "Calls to action",
  template: "Templates",
}

export const MAKE_KIND_LABEL: Record<MakeKind, string> = {
  client: "Client deliverables",
  branding: "Branding practice",
  template: "Template tasks",
}

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# Studio OS: implementation plan (for approval)

Built from `BRIEF-os.md` (v2). The screenshots are used only as a visual reference. All copy is original.

> **Status (Oct 6, 2026):** v1 is built with **no login and no database**, at Prathmesh's request, to ship faster. Data lives in the browser (`localStorage`) with JSON export/import, and the UI is fully **monochrome** (pillars are told apart by letter: V · E · B · P). All screens from Phases 1–3 are in. Sections 3 (Drizzle schema) and 7 (auth) below are the plan for when sync and login are added. The store in `src/lib/store.ts` already uses the same entity shapes, so the move is mostly swapping persistence.

---

## 1. Stack

| Need | Choice |
|---|---|
| App | Next.js 16.3 App Router, TS strict, Server Components for reads, **Server Actions + zod** for writes |
| UI | shadcn/ui (Card, Button, Input, Textarea, Tabs, ToggleGroup, Badge, Checkbox, Progress, Sheet, Drawer, Select, Popover, Calendar, Table, DropdownMenu, Sonner; Chart only for day-30), lucide 16px / stroke 1.5, next-themes |
| Data | Neon Postgres (Vercel Marketplace) + Drizzle ORM (`drizzle-orm/neon-http`), migrations in repo |
| Dates | date-fns v4 + `@date-fns/tz` (`TZDate`, Asia/Kolkata). This is the first-party v4 replacement for `date-fns-tz` and does the same job. |
| Auth | jose HS256 cookie + `proxy.ts`. Next 16 renamed `middleware.ts` to `proxy.ts`; it is the same idea and runs on Node. |
| Tests | Vitest, **only for the date, slot, streak and follow-up maths** (the parts that are easy to get subtly wrong in IST) |

---

## 2. Folder structure

```
src/
  proxy.ts                         # auth guard (Next 16 name for middleware)
  app/
    login/page.tsx, actions.ts     # single password form
    (app)/layout.tsx               # shell: top nav (desktop) · bottom bar + FAB + header menu (mobile)
    (app)/page.tsx                 # Today
    (app)/calendar/page.tsx        # ?view=month|week&at=2026-10-06
    (app)/library/[tab]/page.tsx   # proof|audience|pipeline|templates|swipe|posts|three
    (app)/playbook/page.tsx
    manifest.ts, icon.png, apple-icon.png
  db/
    schema.ts  index.ts  seed.ts  seed-data.ts  migrations/
  lib/
    auth.ts        # sign/verify session
    dates.ts       # IST today(), weekStart(), runDay(), daysLeftInWeek()
    slots.ts       # expand rhythm → slots, fill, open, counts
    streaks.ts     # DM / post / focus streaks, Today's-three score
    followups.ts   # day-3 / day-7 rule
    focus.ts       # auto-pick focus block
    queries/       # read functions per screen (server only)
    actions/       # server actions per domain: posts, leads, touches, today, settings, library, review
  components/
    ui/                       # shadcn
    shell/    top-nav, bottom-bar, new-post-fab, header-menu, settings-sheet, help-dialog, responsive-sheet (Sheet ≥md, Drawer <md)
    post/     post-sheet, pillar-dot, status-pill, copy-button (X/LinkedIn toggle)
    today/    today-header, goal-strip, quick-capture, to-publish-card, todays-three, week-checklist, rule-footer
    calendar/ slots-filled-card, open-slots-card, pillar-legend, month-grid, week-list
    library/  proof-list, audience (ideal-client-card, idea-card, line-columns), pipeline-table, templates, swipe-file, my-posts, three-posts
    playbook/ strategy-card, rhythm-card, pillar-card, rules-list, niche-check
    review/   review-sheet
```

The post sheet and review sheet are driven by URL params (`?post=<id>`, `?new=1&date=…&slot=…&pillar=…`, `?review=1`). Any "Write", "Open slot" or "Turn into post" link opens a prefilled sheet from any screen, and the back button closes it.

---

## 3. Drizzle schema

Every table has `id uuid pk`, `createdAt`, `updatedAt` (timestamptz). **Day fields are Postgres `date` stored as IST `YYYY-MM-DD` strings.** Instants are `timestamptz`.

**Enums:** `pillar` (visual, educational, business, personal) · `post_status` (idea, draft, ready, posted) · `segment` (agency, ai_startup, other) · `lead_stage` (found, contacted, replied, call_booked, proposal, won, lost) · `channel` (x, linkedin, email, other) · `audience_kind` (problem, question, objection) · `proof_kind` (work, result, testimonial) · `swipe_kind` (hook, dm_opener, loom_opener, cta, template) · `make_kind` (client, branding, template)

| Table | Columns (beyond id/timestamps) |
|---|---|
| settings (1 row) | runStart, runEnd, sixMonthGoal, monthlyGoal, dmTarget=10, currentPriceUsd=800, calLink, usdInrRate, cashOnHandInr, floorInr=40000, theme, **playbook jsonb** ¹ |
| rhythm_slots | weekday (0=Mon…6=Sun), slotIndex, pillar · unique(weekday, slotIndex) |
| posts | pillar?, angle, xText, linkedinText, visualNote, visualUrl, status, date?, slotIndex?, postedAt, xUrl, linkedinUrl, likes, replies, dmsFrom, isCta, sourceProofId?, groupId?, **isSample** ² |
| audience_lines | kind, segment? (null = both), text, sortOrder |
| ideal_clients | segment (unique), description |
| prompts | pillar, angle?, text. Holds both "Need an idea?" prompts and each pillar's 5 example ideas ³ |
| proof | title, client, segment, kind, quote, metric, url, imageUrl, date |
| swipe_items | kind, title, body |
| leads | name, company, url, segment (required), channel, stage, lastTouchAt, nextFollowUpAt, dealValueUsd, notes, **contactedAt, repliedAt, callBookedAt, closedAt** ⁴, **isSample** ² |
| touches | leadId?, date, channel, **segment?** ⁵ |
| day_logs | date (unique), focusDone, focusRef |
| weekly_goals | weekStart (unique), title, done, **checks text[]** ⁶ |
| make_items | kind, title, dueDate?, done, sortOrder |
| revenue | date, amountUsd, note |
| weekly_reviews | weekStart (unique), snapshot jsonb, worked, didnt, nextGoal |

Small additions to §7, each needed by something the brief asks for:
1. `playbook` jsonb holds the strategy line, pillar definitions + "Why it works", and the rules list. Playbook is "editable in place" and §7 has nowhere to put these.
2. `isSample` lets the sample posts and leads be "marked Sample and deletable together".
3. Pillar examples go in `prompts` rather than a separate table. The 4 pillars stay fixed; only their text can be edited.
4. Stage dates power "5 replies · 1 call", the review numbers and the day-30 rates by segment.
5. Optional segment on quick `+1` DMs. See question 3.
6. The "This week" ticks are stored on that week's goal row.

---

## 4. Routes

| Route | What |
|---|---|
| `/login` | Password form. The only public page. |
| `/` | Today |
| `/calendar?view=month\|week&at=YYYY-MM-DD` | Month grid (desktop) / week list (mobile default) |
| `/library/[tab]` | proof · audience · pipeline · templates · swipe · posts · three |
| `/playbook` | Strategy, rhythm, pillars, rules, day-30 niche check |
| `manifest.webmanifest`, icons | Add to Home Screen, full-screen |

Settings, Help, Post and Review are sheets (Drawer on mobile), not routes.

---

## 5. Components per screen

**Today** (one column, max-w 680): `TodayHeader` (date chip, IST greeting, subline) → `GoalStrip` (goal · days left · Day N of 183, or an inline "Set this week's goal" input) → `QuickCapture` (input + optional pillar dot + Save idea) → `ToPublishCard` (today's slots: dot, first line, Copy with X/LinkedIn toggle, **Posted**; footer links) → `TodaysThree` (10 warm DMs `6/10` + `+1`; Publish today's post (auto); Focus block + "change"; small streaks) → `WeekChecklist` ("1/5 done", Open → per row; Sunday review only on Sundays) → `RuleFooter`.

**Calendar:** header chips + amber open-slots badge + Week/Month toggle + prev/next → `SlotsFilledCard` (7/26, % of rhythm, segmented bar Posted·Ready·Draft·Idea with counts) + `OpenSlotsCard` → `PillarLegend` → `MonthGrid` (date, today = filled circle, pillar dots, up to 2 previews + status pill, one thin bar per slot) or `WeekList` (mobile).

**Post sheet:** pillar · angle · X text (live count) · LinkedIn text ("Copy from X") · visual note/link · status stepper Idea → Draft → Ready → Posted · date + slot · CTA toggle. The "After posting" section (URLs, likes, replies, DMs from) only appears once the status is Posted.

**Library (Phase 2/3):** pill sub-tabs, with a card list on mobile and a `Table` on desktop for Pipeline. **Playbook (Phase 3):** read-mostly cards, each with an inline "Edit".

**Settings sheet:** rhythm editor (slot list per weekday, plus a "Step up to 14/week" preset), DM target, run dates, goals, price, Cal.com link, USD→INR, cash on hand, theme, JSON export, Make lists (client deliverables with due dates, branding practice, template tasks), History (past reviews), "Remove sample data".

**Daily actions in ≤2 taps:** Posted = 1 tap. `+1` DM = 1 tap (2 if segment tagging is on). Focus done = 1 tap. All use optimistic UI, so they feel instant on a phone.

---

## 6. The maths (all in IST)

- **today** = `format(TZDate.tz("Asia/Kolkata"), "yyyy-MM-dd")`. Every comparison is between date strings, so there are no UTC off-by-one days. Weeks run Mon–Sun (`startOfWeek`, `weekStartsOn: 1`).
- **Run:** Day N = days since runStart + 1 (Oct 6 = **Day 1 of 183**; Oct 6 → Apr 6 inclusive is 183 days). The week's days left include today, so Tuesday shows 6.
- **Slots:** the rhythm is a list of `{weekday, slotIndex, pillar}`. For any date range, each day inside the run gets its weekday's slots. A slot is **filled** when a post has the same `date` and `slotIndex` (any status, including Idea). An **open** slot is unfilled and dated today or later. A **missed** slot is unfilled and in the past; it shows as an empty bar and is not counted as open.
  - **Slots filled (month)** = filled ÷ total. The bar is split by the status of each filling post.
  - **Pillar legend** = filled ÷ total per slot pillar. "No pillar N" counts posts in the month that have no pillar.
  - **Open-slots badge** = open slots from today to the end of the visible month.
  - **Subline:** "to publish today" = today's slots and posts not yet posted. "to write in the next 2 weeks" = open slots in [today, today+13] plus Idea/Draft posts dated in that window.
  - **Placing a post:** when a post gets a date, it takes that day's first open slot with the same pillar, then any open slot. If none is free, it becomes an "extra" post: it shows in the grid but isn't counted.
- **Streaks** (shown small, counted back from yesterday; today adds once done): DMs = weekdays with ≥ dmTarget touches (weekends neither count nor break it). Posts = days where every slot is posted. Focus = days with `focusDone`. **Today's-three score** = items done across the week ÷ 21.
- **Follow-ups:** moving a lead to Contacted sets `contactedAt` and next follow-up = +3 days. The next touch sets +7 days from `contactedAt`, and the one after that clears it. Any stage past Contacted clears it. "Due today" means next follow-up ≤ today.
- **Focus pick:** the client deliverable with the earliest due date, then branding practice (by sort order), then template task. "change" saves the override in `day_logs.focusRef`.
- **Publish today's post** auto-checks once every slot today is posted.

---

## 7. Auth

`/login` → server action compares the password to `APP_PASSWORD` (timing-safe) → sets an httpOnly, Secure, SameSite=Lax `session` cookie holding a jose HS256 JWT signed with `AUTH_SECRET`, valid for 30 days. `proxy.ts` verifies it and redirects everything except `/login`, `_next`, the manifest and icons. Server actions verify again, because they are public POST endpoints. A logout item sits in the header menu.

---

## 8. Seed

`npm run db:seed` runs `src/db/seed.ts` with copy kept in `seed-data.ts`. It is **idempotent**: it does nothing if a settings row already exists. It inserts all of §8: settings, the default 7/week rhythm, this week's placeholder goal, both ideal clients, the problems/questions/objections, ~9 prompts plus 5 examples per pillar, swipe file (5 hooks, DM openers per segment, 1 Loom opener, 2 CTAs), 4 proof placeholders, Make lists, 6 rules, and 3 sample posts + 3 sample leads flagged `isSample`. Copy the brief doesn't spell out (the remaining prompts, examples, templates, pillar "why it works") will be written in the brief's voice: short, plain and kind.

---

## 9. Visual system (§6)

Tokens: canvas `neutral-100`, a window surface (`rounded-2xl`, `shadow-sm`, 1px `neutral-200`, max-w 1100), white cards (`rounded-xl`, 1px border, `p-5`), inner rows (`neutral-50`, `rounded-lg`, `px-3 py-2.5`, 8px gap), and black primary buttons at `h-9`. Dark mode: `neutral-950` / `900` / `800`. Colour appears only in pillar dots, the amber badge, the Draft pill and progress segments. Motion is limited to 150ms fades. Mobile: bottom tab bar, safe-area padding, 44px tap targets.

**Pillar dots:** violet, blue, amber and rose as in §5, but see question 2. Status segments: posted = `neutral-900`, ready/draft/idea = lighter neutral steps (validated as a readable ordinal ramp), and an open slot = an empty track.

---

## 10. Phase 1 tasks (≈19 h of build time)

| # | Task | Effort |
|---|---|---|
| 1 | Foundation: §6 tokens, Geist, theme, manifest + icons + safe areas (scaffold already done) | 1.5 h |
| 2 | Drizzle schema for **all** tables now (avoids migration churn later), Neon client, first migration, seed | 2 h |
| 3 | Auth: login, jose session, `proxy.ts` | 1 h |
| 4 | `dates` / `slots` / `streaks` / `followups` / `focus` libs + Vitest tests | 2 h |
| 5 | Shell: desktop nav, mobile bottom bar + FAB + header menu, responsive Sheet/Drawer | 1.5 h |
| 6 | Post sheet: create/edit, URL prefill, slot placement, copy X/LinkedIn | 2 h |
| 7 | Today: all 7 blocks, optimistic Posted / +1 / focus | 3 h |
| 8 | Calendar: month grid, week list, slots-filled card, open slots, legend | 3 h |
| 9 | Settings sheet: rhythm editor, all §4.6 fields, JSON export, Make lists | 2 h |
| 10 | Deploy: Vercel + Neon + env vars + migrate/seed, then check on iPhone | 1 h + your steps |

Today's "Open →" links to screens that arrive in Phase 2/3 (Pipeline, Proof, My posts, Review) will land on a calm "Coming next" placeholder. `+1` DMs work from day one.

**Phase 2:** Library: Audience, Proof, Pipeline (follow-ups wired into Today), Swipe file, My posts. **Phase 3:** Playbook, Review sheet, Templates, One idea → three posts, day-30 niche check.

---

## 11. Assumptions (simplest option chosen)

1. Built in this folder. The GitHub repo is decided by question 1.
2. Oct 6, 2026 is Day 1. The brief's "Day 2" example is treated as illustrative.
3. Rhythm slots only exist inside the run, so October shows **x/26** (Oct 6–31) rather than /31, and Oct 1–5 never shows as missed. This is one line to flip if you'd rather count the whole month.
4. Weekday 0 = Monday.
5. The 4 pillars are fixed. Their text is editable; new pillars can't be added.
6. "This week" ticks are manual. Only "Publish today's post" auto-checks, as the brief says.
7. Marking a lead **Won** with a deal value logs a Revenue row. Other income can be added in the Review sheet.
8. Editing the rhythm applies to every date, past and future.
9. No drag-and-drop, AI, notifications or auto-posting, as listed in "out of scope".

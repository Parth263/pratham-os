# Studio OS v2: calmer, colour-coded, work → post → DM

**Goal:** posting and outreach should feel like one smooth motion. Anything you make or explore turns into a post the same day, and every post can start a conversation. Built on the *Next-Level Systems* guide (Ali Alkaragouli): fewer things on screen, one next action, the first step only, start now by default, kind copy.

Status: **approved Oct 6.** Each phase ends with a review on `localhost:3000`, and I push to `main` once you're happy with it.

**Decisions from review**
- Navigation regroup: yes (Work + People; reference moves into Playbook).
- Colour: **as many different colours as possible**: pillars *and* the daily areas (see §2).
- **No timing.** No day blocks, no clock, no times on "Not now", because there's no posting routine yet.
- Work items take **screenshots and motion** (images, GIFs, screen recordings), since motion gets attention.

---

## 1. What the guide says → what we build

| Guide | What it means here |
|---|---|
| **Subtract before you add** (SYS.04) | Today shows one "Now" card and three small tiles. Everything else is folded away or moved off Today. Library's 7 tabs shrink to 2 (see §3). |
| **Clarity → Prioritization** (SYS.04) | A pinned compass at the top: this week's goal + days left. The app always picks **one next action** for you. |
| **Opt-out, not opt-in** (SYS.02) | The main button is always **Start now**. "Not now" asks *later today or tomorrow, and what's the first step* (an implementation intention without clock times). Saving for "later" is never the easy path. |
| **Smallest first step** (SYS.05, SYS.15) | Every task shows only its first physical step ("Open Framer, screenshot the hero"). The 3–5 steps sit in a focus view, one at a time. |
| **Procrastination Trident** + "I'm stuck" (SYS.06, 07) | An **I'm stuck** button: fear → write a V0 you won't post; overwhelm → first step only; "doesn't feel like me" → change the angle or pillar; no idea → your latest work. |
| **One colour per category** (SYS.01) | Light pillar colours everywhere: calendar, chips, slots, posts. You can scan where the week went. |
| **Evidence** (SYS.16) | A small "this week" strip: 7 day dots and what you shipped. Short-term reward, never a scoreboard. |
| **Rut protocol** (SYS.12) | After 2+ quiet days, Today becomes **Fresh start**: missed things are hidden, not listed, and there's one action. |
| **Signal vs noise, identity** (SYS.09, 10) | Playbook gets a compass: goal + why, one identity line, signal list, noise list. |
| **When a system breaks** (SYS.10) | The Sunday review asks: goal problem, identity problem, or system problem? One tap each, with one suggested tweak. |
| **Kind self-talk** (SYS.05) | Copy rewrite: no "overdue" and no red. "Ready when you are." Short-term payoffs ("Post this and today's content is done"). |

---

## 2. Look and feel

- **No window frame, no max width.** The app goes edge to edge with a full-width sticky top bar and fluid padding (`px-5 → lg:px-10 → 2xl:px-16`). Only text blocks keep a comfortable line length.
- **Desktop uses the width:**
  - Today becomes a 2-column grid: Now + tiles on the left, capture, evidence and follow-ups in a right rail.
  - Calendar week view becomes 7 real columns.
  - Work becomes a responsive card grid (`auto-fill, minmax(280px, 1fr)`).
- **Light accent colours, as different as possible.** A soft tinted chip (50 background, 200 border, 700 text) plus a solid dot, always shown with a name or letter. I searched every Tailwind colour for the most distinct set of six. This one passes the colour-blind check (worst pair ΔE 9.2) and the normal-vision check (ΔE 17.3) in both light and dark:

  | Category | Colour | Dot |
  |---|---|---|
  | Visual (pillar) | violet | `#7C3AED` |
  | Educational (pillar) | sky | `#0284C7` |
  | Business (pillar) | amber | `#D97706` |
  | Personal (pillar) | pink | `#DB2777` |
  | Reach out (area) | lime | `#84CC16` |
  | Make & explore (area) | teal | `#14B8A6` |

  The Post area takes the colour of today's pillar. New pillars choose from red, indigo, orange or emerald. Pillars can't share a colour.
- Statuses (Idea → Draft → Ready → Posted) stay neutral, so colour always means "which pillar".
- Everything else stays black, white and grey.

---

## 3. Navigation (fewer places to look)

**Desktop:** Today · Calendar · **Work** · **People** · Playbook
**Phone:** Today · Calendar · ➕ · Work · People. Playbook moves to the ⋯ menu, since it's reference material, not daily.

| Was (Library, 7 tabs) | Goes to |
|---|---|
| Proof, One idea → three posts, My posts | **Work**: everything you made or explored, and what's been posted from it |
| Pipeline | **People**: DM session + plain lead list |
| Audience, Templates, Swipe file | **Playbook**: reference, opened when needed |

---

## 4. Screens

### Today
1. **Compass strip:** this week's goal · 6 days left · Day N of 183.
2. **Now card:** one action, with its first step, **Start now** and **Not now**. Picked in this order:
   1. Today's post: "Post it" if ready, "Finish it" if a draft, "Fill it from your latest work" if the slot is empty.
   2. Warm DMs below target: opens the DM session.
   3. Make/explore block.
   4. All done: "That's today. You shipped …"
3. **Three tiles:** Post · Reach out (6/10, +1) · Make, each in its own colour with a tick.
4. **Right rail:** capture (toggle *Idea* / *Work I did*), this week's evidence, follow-ups due, and the weekly checklist (folded).
5. **Today's rule** at the bottom.
- **Focus view** (from Start now): full screen, one task, its steps one at a time, a Done button. Nothing else on screen.
- **Fresh start:** shown after 2+ quiet days instead of the usual layout.

### Work: turn proof and explorations into posts fast
- **Capture "Work I did"** from anywhere: drop or paste **screenshots and motion** (PNG, JPG, GIF, MP4, WebM), add a title, an optional link (Figma, Framer, Dribbble), and a kind (*Exploration · Client work · Result · Kind words*). It then asks right away: **"Post it now? About 10 minutes"** (opt-out).
- **Media lives in this browser** (IndexedDB, roomy enough for screen recordings). The JSON backup covers text only; your original files stay on your computer.
- **Card grid:** videos and GIFs play as muted loops, so you see the motion, plus kind and "not posted yet" or "posted 2×". Actions on each card:
  - **Post it**
  - **Make 3 posts** (one idea → three)
  - **Send to someone**
- **Ship composer** (the post sheet, simplified):
  - A template chip row for each kind of work. Exploration gets: *What I tried → what I'd change*, *Before → after → why*, *3 directions, which wins?*
  - Pillar chip and auto slot ("Next open Visual slot: Wed 7"). The rest sits under "More".
  - The media shown big, with **Download** (and **Copy image** for stills) so you can attach it on X or LinkedIn.
  - **Copy & open X** (pre-filled X post), **Copy & open LinkedIn**, **Mark posted**.
  - Visual posts lead with motion: templates and first steps say "Record a 10-second screen capture of the interaction".
- **After posting:** "Send this to 3 people who'd care". It opens the DM session with the post link inside the opener.

### People: outreach without the overwhelm
- **DM session:** one lead at a time. Due follow-ups come first, then new leads. Each card has a suggested opener for its segment, plus **Copy**, **Open profile**, **Sent (+1)** and **Skip**. A counter shows 6/10, and you can quick-add a new lead mid-session.
- **Lead list:** the plain table stays, with filters Due · All · Agency · AI startup · Other.

### Calendar
- Pillar-coloured chips, slot bars and legend, plus the pinned goal strip.
- Missed slots fade to "skipped" and are never counted against you.
- The desktop week view becomes 7 columns.

### Playbook
- **Compass:** 6-month goal + why · identity line · signal list · noise list.
- **Pillars editor:** add, rename, recolour, reorder and remove. 3–5 is recommended and 6 is the maximum, since fewer categories means better focus. Each pillar keeps its definition, "why it works", examples and **Write one**.
- **Rhythm editor** moves here from Settings.
- Reference sections: Audience (problems, questions, objections, idea prompts), templates, hooks and openers, rules, day-30 niche check.

### Sunday review
- **Evidence first:** what you shipped this week.
- **If the week was thin:** "Goal, identity or system?" with one suggested tweak each.
- Three short prompts, then next week's one goal.

---

## 5. Data changes (browser storage, migrated automatically)

The store moves to `version: 2`, with a `migrate()` that keeps every existing post, lead and touch.

- **`pillars[]`:** `{ id, name, color, definition, why, sortOrder }`. Posts, rhythm and prompts point to a pillar by id. The 4 current pillars keep ids `visual / educational / business / personal`, so nothing breaks. Deleting a pillar asks where its posts should go.
- **Proof → Work:** adds kind `exploration` and a `notes` field ("what I tried"). Segment becomes optional. "Posted N×" is counted from `post.sourceProofId`.
- **`settings`:** `name` (for the greeting).
- **`playbook`:**
  - `goalWhy`
  - `identity`
  - `signal[]`
  - `noise[]`
- **`dayLogs[date].plans`:** `{ area: { when: "later" | "tomorrow", firstStep } }`, from "Not now".
- **Work media:** `{ id, kind: image | gif | video, name, size }` on each Work item, with the file stored in IndexedDB.
- **`make[].firstStep`:** the first physical step for each Make item.
- **`reviews[].diagnosis`:** `goal | identity | system`.

There's still no login or database. The v2 shapes map one-to-one onto the Postgres plan in `PLAN.md` for later.

---

## 6. Phases (each ends with a review on localhost)

| Phase | What you'll review | Effort |
|---|---|---|
| **A. Look & pillars** | Full-width layout, light pillar colours across Calendar, Today and the post sheet, Pillars editor (add, rename, recolour), v1 → v2 migration with your data intact | ~2.5 h |
| **B. Today, calmer** | Compass strip, Now card with Start now / Not now, three tiles, right rail, evidence strip, Fresh start, focus view, copy rewrite | ~3 h |
| **C. Work → Post** | Capture "Work I did" with screenshots and motion, Work grid with playing loops, Ship composer with templates + Copy & open X/LinkedIn + auto slot, Make 3 posts, "send to 3 people" | ~3 h |
| **D. People, Playbook, Stuck** | DM session, nav regroup, Playbook compass + signal/noise + identity, I'm stuck helper, Sunday review diagnostic | ~3 h |

**Out of scope (unchanged):** login, database, AI writing, auto-posting, notifications.

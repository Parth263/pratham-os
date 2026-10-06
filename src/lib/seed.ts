import { addDaysTo, weekStartOf } from "./dates"
import type {
  AppData,
  AudienceKind,
  Lead,
  MakeItem,
  Pillar,
  Post,
  Prompt,
  Proof,
  RhythmSlot,
  Segment,
  SwipeItem,
  SwipeKind,
} from "./types"

export const uid = () => crypto.randomUUID()
const stamp = () => {
  const now = new Date().toISOString()
  return { createdAt: now, updatedAt: now }
}

export const DEFAULT_RHYTHM: Pillar[] = ["visual", "educational", "visual", "business", "visual", "educational", "personal"]

export function rhythmFromList(perDay: Pillar[][]): RhythmSlot[] {
  return perDay.flatMap((pillars, weekday) => pillars.map((pillar, slotIndex) => ({ id: uid(), weekday, slotIndex, pillar })))
}

/** 14/week: one visual post plus one written post a day (~60% educational, 30% business, 10% personal). */
export const STEP_UP_RHYTHM: Pillar[][] = [
  ["visual", "educational"],
  ["visual", "business"],
  ["visual", "educational"],
  ["visual", "educational"],
  ["visual", "business"],
  ["visual", "personal"],
  ["visual", "educational"],
]

export function blankPost(patch: Partial<Post> = {}): Post {
  return {
    id: uid(),
    ...stamp(),
    pillar: null,
    angle: "",
    xText: "",
    linkedinText: "",
    visualNote: "",
    visualUrl: "",
    status: "draft",
    date: null,
    slotIndex: null,
    postedAt: null,
    xUrl: "",
    linkedinUrl: "",
    likes: null,
    replies: null,
    dmsFrom: null,
    isCta: false,
    sourceProofId: null,
    groupId: null,
    isSample: false,
    ...patch,
  }
}

export function blankLead(patch: Partial<Lead> = {}): Lead {
  return {
    id: uid(),
    ...stamp(),
    name: "",
    company: "",
    url: "",
    segment: "agency",
    channel: "x",
    stage: "found",
    lastTouchAt: null,
    nextFollowUpAt: null,
    dealValueUsd: null,
    notes: "",
    contactedAt: null,
    repliedAt: null,
    callBookedAt: null,
    closedAt: null,
    isSample: false,
    ...patch,
  }
}

const audience = (kind: AudienceKind, segment: Segment | null, text: string) => ({ id: uid(), ...stamp(), kind, segment, text })
const prompt = (pillar: Pillar, angle: string | null, text: string): Prompt => ({ id: uid(), ...stamp(), pillar, angle, text })
const swipe = (kind: SwipeKind, title: string, body: string): SwipeItem => ({ id: uid(), ...stamp(), kind, title, body })
const make = (kind: MakeItem["kind"], title: string, sortOrder: number): MakeItem => ({
  id: uid(),
  ...stamp(),
  kind,
  title,
  dueDate: null,
  done: false,
  sortOrder,
})

export function emptyData(): AppData {
  return {
    version: 1,
    seeded: false,
    settings: {
      runStart: "2026-10-06",
      runEnd: "2027-04-06",
      sixMonthGoal: "",
      monthlyGoal: "",
      dmTarget: 10,
      currentPriceUsd: 800,
      calLink: "",
      usdInrRate: 84,
      cashOnHandInr: 0,
      floorInr: 40000,
    },
    playbook: {
      strategy: "",
      summary: "",
      pillars: {
        visual: { definition: "", why: "" },
        educational: { definition: "", why: "" },
        business: { definition: "", why: "" },
        personal: { definition: "", why: "" },
      },
      rules: [],
      nicheDecision: "",
    },
    rhythm: [],
    posts: [],
    audience: [],
    idealClients: { agency: "", ai_startup: "" },
    prompts: [],
    proof: [],
    swipe: [],
    leads: [],
    touches: [],
    dayLogs: {},
    weeklyGoals: {},
    make: [],
    revenue: [],
    reviews: [],
  }
}

export function seedData(today: string): AppData {
  const base = emptyData()
  const week = weekStartOf(today)
  const rhythm = rhythmFromList(DEFAULT_RHYTHM.map((p) => [p]))
  const slotFor = (d: string) => (d >= base.settings.runStart ? 0 : null)

  const proof: Proof[] = [
    { title: "Homepage for a Swiss studio", client: "Swiss agency", segment: "agency", kind: "work", quote: "", metric: "", url: "", imageUrl: "", date: null },
    { title: "Site refresh for a second agency", client: "Agency", segment: "agency", kind: "work", quote: "", metric: "", url: "", imageUrl: "", date: null },
    { title: "Launch page for a coach", client: "Coach", segment: "other", kind: "testimonial", quote: "Add their kind words here.", metric: "", url: "", imageUrl: "", date: null },
    { title: "Booking page for a second coach", client: "Coach", segment: "other", kind: "testimonial", quote: "Add their kind words here.", metric: "", url: "", imageUrl: "", date: null },
  ].map((p) => ({ id: uid(), ...stamp(), ...(p as Omit<Proof, "id" | "createdAt" | "updatedAt">) }))

  return {
    ...base,
    seeded: true,
    settings: {
      ...base.settings,
      sixMonthGoal: "~180 posts, DMs most weekdays, a niche picked at day 30, and a branding-led offer ready for 2027.",
      monthlyGoal: "₹40k floor this month, on the way to $10k/month.",
      calLink: "https://cal.com/your-link",
    },
    playbook: {
      strategy: "How a solo designer gets agency and startup clients from content.",
      summary:
        "Post the work every day. Teach founders what their page is missing. Say what you sell once a week. Then turn the attention into real conversations in DMs.",
      pillars: {
        visual: {
          definition: "Client work, concepts, Framer builds and identity explorations. Always a strong image with a caption that gives context.",
          why: "Founders see work someone else paid for. Everyone stops for a good image.",
        },
        educational: {
          definition: "Landing-page and branding lessons for agency and startup founders: hero clarity, proof, positioning.",
          why: "It shows you understand the problem before they hire you. These are the posts people save.",
        },
        business: {
          definition: "The offer, results, the 10-day process, the day-3 checkpoint, milestones and case studies. The call to action lives here.",
          why: "People can't hire you for something you never mention. Once a week, say it plainly.",
        },
        personal: {
          definition: "The journey: going solo, learning branding by December, what's working and what isn't.",
          why: "People hire people. A little of your story makes the rest of your posts easier to trust.",
        },
      },
      rules: [
        "Post the work, not the advice about the work.",
        "Every post gets a visual.",
        "Write for one founder, not everyone.",
        "DMs before design.",
        "Done and posted beats perfect and saved.",
        "One goal this week. Just one.",
      ],
      nicheDecision: "",
    },
    rhythm,
    idealClients: {
      agency:
        "Founder-led creative or marketing agency, 3–20 people. Their client work is sharp, but the site still looks like year one. They want a page that sells today's agency without a 3-month rebuild.",
      ai_startup:
        "Seed-stage AI or tech team with a live product and a template-looking landing page. A launch or raise is coming up and the page has to look as serious as the product.",
    },
    audience: [
      audience("problem", "agency", "Our site undersells the work we actually do"),
      audience("problem", null, "We rebuilt it ourselves and it still looks generic"),
      audience("problem", "ai_startup", "Every AI landing page looks the same — gradients and buzzwords"),
      audience("problem", "ai_startup", "We launch in 3 weeks and the page isn't ready"),
      audience("problem", "agency", "Our case studies are buried three clicks deep"),
      audience("question", null, "Full rebrand or just a new homepage?"),
      audience("question", null, "Why Framer?"),
      audience("question", null, "Can my team edit it after handover?"),
      audience("question", null, "How does the day-3 refund work?"),
      audience("question", null, "Will it convert or just look nicer?"),
      audience("objection", "agency", "We'll fix the site after the next big client"),
      audience("objection", null, "A marketplace freelancer is cheaper"),
      audience("objection", null, "Our in-house designer can handle it"),
      audience("objection", null, "10 days sounds too fast to be good"),
    ],
    prompts: [
      // "Need an idea?" prompts
      prompt("visual", "Before → after", "Redesign one hero section of an agency site you admire and post the before/after"),
      prompt("visual", "What if", "Pick a startup with a template-looking page and post the hero you'd ship instead"),
      prompt("educational", "Teardown", "The 3 things a founder-led agency homepage must say in 5 seconds"),
      prompt("educational", "Myth", "Why “clean and minimal” isn't positioning, and what to say instead"),
      prompt("educational", "How-to", "How to turn one case study into a hero section that sells"),
      prompt("business", "Process", "Walk through day 1 to day 10 of an Outgrown Page project"),
      prompt("business", "Offer", "What $800 gets you, and what it doesn't"),
      prompt("personal", "Lesson", "One branding lesson from this week's practice and where you got it wrong"),
      prompt("personal", "Behind the scenes", "What going solo straight out of college looks like this month"),
      // Pillar example ideas
      prompt("visual", null, "Concept: homepage for a Swiss studio, framed as “what if”"),
      prompt("visual", null, "Before/after: an agency hero rewritten and rebuilt in Framer"),
      prompt("visual", null, "Three hero directions for one AI product. Which would you ship?"),
      prompt("visual", null, "An identity exploration: wordmark, type and colour in one image"),
      prompt("visual", null, "A Framer build start to finish, as a 20-second screen recording"),
      prompt("educational", null, "Why your hero needs proof, not a slogan"),
      prompt("educational", null, "Your case studies are the product. Put them on the homepage."),
      prompt("educational", null, "Five words that make every AI landing page sound the same"),
      prompt("educational", null, "How to write a headline a founder would say out loud"),
      prompt("educational", null, "What a Framer site lets your team change without a designer"),
      prompt("business", null, "Why I offer a full refund on day 3"),
      prompt("business", null, "The Outgrown Page: one page, 10 working days, $800"),
      prompt("business", null, "What a client said after launch, and what changed for them"),
      prompt("business", null, "My process in one image: brief, direction, build, handover"),
      prompt("business", null, "Two spots open this month. Here's who they're for."),
      prompt("personal", null, "Month 1 of learning identity design: what clicked"),
      prompt("personal", null, "Why I picked one offer instead of five services"),
      prompt("personal", null, "How my first Swiss client happened, from Pune"),
      prompt("personal", null, "What I'd tell myself on graduation day about going solo"),
      prompt("personal", null, "The week I nearly stopped posting, and why I didn't"),
    ],
    proof,
    swipe: [
      swipe("hook", "Grew, didn't", "Your agency grew. Your homepage didn't."),
      swipe("hook", "Product vs page", "Your product is ready. Your landing page isn't."),
      swipe("hook", "Five seconds", "If a founder can't tell what you do in 5 seconds, they're gone."),
      swipe("hook", "One evening", "I redesigned one hero section in an evening. Here's the before and after."),
      swipe("hook", "Year one", "Most agency sites still sell the agency from three years ago."),
      swipe(
        "dm_opener",
        "Agency",
        "Hey {name} — saw {specific win}. The work's levelled up; the site hasn't. I mocked a new hero in Framer — want it?",
      ),
      swipe(
        "dm_opener",
        "AI startup",
        "Hey {name} — congrats on {launch or raise}. The product looks sharp; the page still looks like a template. I sketched a hero that matches it — want to see?",
      ),
      swipe(
        "dm_opener",
        "Other",
        "Hey {name} — liked your post on {topic}. I design Framer pages for founders. Happy to send one quick idea for your homepage if that's useful.",
      ),
      swipe(
        "loom_opener",
        "Homepage walkthrough",
        "Hi {name}, I'm Prathmesh. I took three minutes to walk through your homepage and show one change that would make it look like the agency you are now. No pitch at the end, just the idea.",
      ),
      swipe("cta", "Two spots", "If your site still looks like year one, I have two Outgrown Page spots this month. Book a call from my bio."),
      swipe("cta", "Reply for a Loom", "Want a second pair of eyes on your hero? Reply “page” and I'll send a 2-minute Loom."),
      swipe("template", "Before → after → why", "Before: {screenshot}\nAfter: {screenshot}\n\nWhy it works:\n1. {change one}\n2. {change two}\n3. {change three}"),
      swipe("template", "Problem → usual fix → better fix", "{A problem founders feel}\n\nWhat most people do: {usual fix}\nWhat works better: {your fix}\n\nOne example: {example}"),
      swipe("template", "One lesson from a project", "On {project} I learned {lesson}.\n\nWhat happened: {story}\nWhat I'd do next time: {change}"),
      swipe(
        "template",
        "The offer, plainly",
        "What it is: one Framer landing page\nWho it's for: {segment}\nHow long: 10 working days\nPrice: $800\nThe safety net: full refund on day 3",
      ),
    ],
    make: [
      make("branding", "MadeByJames: watch one breakdown, redo the exercise", 0),
      make("branding", "Will Paterson: one logo study", 1),
      make("branding", "CJ Cawley: one identity breakdown", 2),
      make("branding", "Sticky Notes: one lesson, one sketch", 3),
      make("branding", "Sabri Graphics: one type exploration", 4),
      make("branding", "Frankie Harry: one brand system study", 5),
      make("branding", "1 identity exploration this week", 6),
      make("template", "Coachverse template", 0),
      make("template", "Offerlane template", 1),
      make("template", "Circlelane template", 2),
    ],
    weeklyGoals: { [week]: { weekStart: week, title: "Send 50 warm DMs and book 2 calls.", done: false, checks: [] } },
    posts: [
      blankPost({
        isSample: true,
        pillar: "educational",
        status: "ready",
        date: today,
        slotIndex: slotFor(today),
        angle: "Agencies outgrow their homepage before they notice",
        xText:
          "Your agency grew. Your homepage didn't.\n\nThree signs your site is selling the agency you were in year one:\n\n1. The newest work isn't on the homepage\n2. The headline could belong to anyone\n3. You'd rather send a PDF than the link",
        visualNote: "Side-by-side: a year-one hero vs. a rebuilt one",
      }),
      blankPost({
        isSample: true,
        pillar: "visual",
        status: "draft",
        date: addDaysTo(today, 1),
        slotIndex: slotFor(addDaysTo(today, 1)),
        angle: "What if a Swiss studio led with the work?",
        xText: "Concept: what a Swiss design studio's homepage could look like if it led with the work, not the slogan.",
        visualNote: "Framer hero concept, desktop + mobile",
      }),
      blankPost({
        isSample: true,
        pillar: "business",
        status: "idea",
        date: addDaysTo(today, 2),
        slotIndex: slotFor(addDaysTo(today, 2)),
        angle: "Why there's a full refund on day 3",
        xText: "Why I offer a full refund on day 3 of every project.",
        isCta: true,
      }),
    ],
    leads: [
      blankLead({ isSample: true, name: "Sample lead", company: "Field & Form Studio", segment: "agency", stage: "contacted", contactedAt: addDaysTo(today, -3), nextFollowUpAt: today, notes: "Strong case studies, dated site." }),
      blankLead({ isSample: true, name: "Sample lead", company: "Vector Labs", segment: "ai_startup", stage: "found", notes: "Launching next month." }),
      blankLead({ isSample: true, name: "Sample lead", company: "Bloom Coaching", segment: "other", stage: "replied", contactedAt: addDaysTo(today, -5), repliedAt: addDaysTo(today, -1) }),
    ],
  }
}

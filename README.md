# pratham-os

Pratham's Bizz work-station. First module: **Studio OS**, a calm planner for posting daily on X and LinkedIn, sending warm DMs, and keeping one goal a week.

Built from a private product brief. The plan lives in [`docs/PLAN.md`](docs/PLAN.md).

## Screens

- **Today**: the week's goal, today's post, the 10 warm DMs, one focus block, the weekly checklist
- **Calendar**: month grid and week list, slots filled, open slots, per-pillar counts
- **Library**: Proof · Audience · Pipeline · Templates · Swipe file · My posts · One idea, three posts
- **Playbook**: the strategy, rhythm, four pillars, rules, day-30 niche check
- Sheets for writing posts, leads, Settings and the Sunday review

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm test        # date, slot, streak and follow-up maths (IST)
npm run build   # production build
```

## Data

There's no login or database yet. Everything is saved in the browser (`localStorage`), so each device keeps its own copy. Use **Settings → Export JSON / Import JSON** to back up or move your data between devices.

Every day, week and streak is counted in India time (Asia/Kolkata), with weeks running Monday to Sunday.

## Deploy

Import the repo into Vercel. It needs no environment variables yet.

## Later

- Password login (`APP_PASSWORD`, `AUTH_SECRET`): about 5 minutes on your side to set two env vars
- Neon Postgres + Drizzle for phone/laptop sync: one "Add Neon" click in Vercel Marketplace, then import your JSON backup

## Credits

Layout inspired by Sofiane's post planner ([@sofianedesign](https://x.com/sofianedesign)). Content strategy shaped by Liutauras Liucvaikis ([@liutauras_liu](https://x.com/liutauras_liu), [brandedwords.studio](https://brandedwords.studio)). All copy is original.

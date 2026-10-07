# pratham-os

Pratham's Bizz work-station. First module: **Studio OS**, a calm planner for posting daily on X and LinkedIn, sending warm DMs, and keeping one goal a week.

Built from a private product brief. Plans: [`docs/PLAN.md`](docs/PLAN.md), [`docs/PLAN-v2.md`](docs/PLAN-v2.md).

## Screens

- **Today**: the week's goal, today's post, the 10 warm DMs, one focus block, the weekly checklist
- **Calendar**: month grid and week columns, slots filled, open slots, colour per pillar
- **Library**: Proof · Audience · Pipeline · Templates · Swipe file · My posts · One idea, three posts
- **Playbook**: the strategy, your pillars (editable), rhythm, rules, day-30 niche check
- Sheets for writing posts, leads, Settings and the Sunday review

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui · Postgres (Neon) + Drizzle · single-password login (jose cookie, `src/proxy.ts`).

## How data works

- The UI reads from an in-browser store, so it's instant and keeps working offline.
- Every change is diffed and only the changed items are sent to `/api/data`. Each post, lead, pillar and so on is one row in the `records` table, so your phone and laptop merge item by item.
- The app pulls from the database when the tab comes back into view and every 30 seconds.
- On a fresh database, the first device you sign in on becomes the starting point.
- Every day, week and streak is counted in India time (Asia/Kolkata), with weeks running Monday to Sunday.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill APP_PASSWORD and AUTH_SECRET
npm run dev
```

Open http://localhost:3000.

- **No `DATABASE_URL`?** Local dev uses an embedded Postgres (PGlite) stored in `.data/`, so everything works before Neon exists.
- **No `APP_PASSWORD`?** Login is switched off in development. In production it's always required.

```bash
npm test             # dates, slots, streaks, follow-ups, migration, sync
npm run db:generate  # after changing src/db/schema.ts
npm run db:migrate   # apply migrations to DATABASE_URL
```

## Ship it on Vercel (about 10 minutes, once)

1. **Import:** vercel.com → *Add New → Project* → import `Parth263/pratham-os` → *Deploy*. The framework is detected automatically.
2. **Database:** in the project, *Storage → Create Database → Neon* (Vercel Marketplace), connected to all environments. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. **Login:** under *Settings → Environment Variables*, add:
   - `APP_PASSWORD`: your password. Make it long.
   - `AUTH_SECRET`: 32+ random characters. Generate one with `openssl rand -base64 48`.
4. **Redeploy:** *Deployments → ⋯ → Redeploy*. Every deploy runs `vercel-build`, which applies database migrations, then builds.
5. **Sign in:** open the site and sign in. To bring over data from another browser, use *Settings → Export JSON* there, then *Import JSON* on the live site.

Changing `APP_PASSWORD` or `AUTH_SECRET` signs every device out.

**iPhone:** open the site in Safari → Share → *Add to Home Screen*.

## Credits

Layout inspired by Sofiane's post planner ([@sofianedesign](https://x.com/sofianedesign)). Content strategy shaped by Liutauras Liucvaikis ([@liutauras_liu](https://x.com/liutauras_liu), [brandedwords.studio](https://brandedwords.studio)). All copy is original.

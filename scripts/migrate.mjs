// Applies database migrations. Runs on every Vercel deploy (see "vercel-build").
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.warn("[migrate] No DATABASE_URL set, skipping. Add Neon from the Vercel Marketplace to enable sync.")
  process.exit(0)
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" })
  console.log("[migrate] Database is up to date.")
} finally {
  await client.end()
}

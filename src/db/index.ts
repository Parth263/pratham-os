import { mkdir } from "node:fs/promises"
import path from "node:path"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export type DB = ReturnType<typeof drizzle<typeof schema>>

/**
 * Production: Postgres (Neon) from DATABASE_URL.
 * Local development without DATABASE_URL: an embedded Postgres (PGlite) in .data/,
 * migrated on first use, so the app behaves the same before Neon is connected.
 */
export type DbMode = "postgres" | "embedded" | "none"

export function dbMode(): DbMode {
  if (process.env.DATABASE_URL) return "postgres"
  if (process.env.NODE_ENV !== "production") return "embedded"
  return "none"
}

const cache = globalThis as unknown as { __studioDb?: Promise<DB> }

export function getDb(): Promise<DB> | null {
  const mode = dbMode()
  if (mode === "none") return null
  if (!cache.__studioDb) {
    cache.__studioDb = (mode === "postgres" ? connectPostgres() : connectEmbedded()).catch((err) => {
      cache.__studioDb = undefined
      throw err
    })
  }
  return cache.__studioDb
}

async function connectPostgres(): Promise<DB> {
  // prepare: false keeps it working through Neon's pooled (PgBouncer) endpoint.
  const client = postgres(process.env.DATABASE_URL as string, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10, onnotice: () => {} })
  return drizzle(client, { schema })
}

async function connectEmbedded(): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite")
  const { drizzle: drizzleLite } = await import("drizzle-orm/pglite")
  const { migrate } = await import("drizzle-orm/pglite/migrator")
  const dir = path.join(process.cwd(), ".data", "pglite")
  await mkdir(dir, { recursive: true })
  const client = new PGlite(dir)
  const db = drizzleLite(client, { schema })
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") })
  return db as unknown as DB
}

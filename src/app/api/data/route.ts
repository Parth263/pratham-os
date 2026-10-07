import { and, eq, inArray, sql } from "drizzle-orm"
import { cookies } from "next/headers"
import { z } from "zod"
import { dbMode, getDb } from "@/db"
import { records } from "@/db/schema"
import { authRequired, SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { ALL_COLLECTIONS } from "@/lib/collections"

export const dynamic = "force-dynamic"

const Key = z.object({ collection: z.enum(ALL_COLLECTIONS), id: z.string().min(1).max(200) })
const Payload = z.object({
  upserts: z.array(Key.extend({ data: z.record(z.string(), z.unknown()) })).max(5000),
  deletes: z.array(Key).max(5000),
})

async function authed() {
  if (!authRequired()) return true
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
}

const noDb = () =>
  Response.json({ mode: "none", error: "No database connected. Add Neon from the Vercel Marketplace (it sets DATABASE_URL)." }, { status: 503 })

/** Everything, as one row per item. */
export async function GET() {
  if (!(await authed())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const db = await getDb()
  if (!db) return noDb()
  const rows = await db.select().from(records)
  return Response.json(
    {
      mode: dbMode(),
      records: rows.map((r) => ({ collection: r.collection, id: r.id, data: r.data, updatedAt: r.updatedAt.toISOString() })),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}

/** Applies a batch of changed and deleted items in one transaction. */
export async function POST(request: Request) {
  if (!(await authed())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const db = await getDb()
  if (!db) return noDb()

  const parsed = Payload.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Bad payload", issues: parsed.error.issues.slice(0, 5) }, { status: 400 })
  const { upserts, deletes } = parsed.data

  await db.transaction(async (tx) => {
    for (let i = 0; i < upserts.length; i += 500) {
      const chunk = upserts.slice(i, i + 500)
      await tx
        .insert(records)
        .values(chunk.map((r) => ({ collection: r.collection, id: r.id, data: r.data })))
        .onConflictDoUpdate({
          target: [records.collection, records.id],
          set: { data: sql`excluded.data`, updatedAt: sql`now()` },
        })
    }
    const byCollection = new Map<string, string[]>()
    for (const d of deletes) byCollection.set(d.collection, [...(byCollection.get(d.collection) ?? []), d.id])
    for (const [collection, ids] of byCollection) {
      await tx.delete(records).where(and(eq(records.collection, collection), inArray(records.id, ids)))
    }
  })

  return Response.json({ ok: true, upserted: upserts.length, deleted: deletes.length })
}

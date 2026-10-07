import { index, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

/**
 * One row per item (a post, a lead, a pillar, a day's log…). Each device sends only the
 * rows it changed, so edits from the phone and the laptop merge item by item.
 */
export const records = pgTable(
  "records",
  {
    collection: text("collection").notNull(),
    id: text("id").notNull(),
    data: jsonb("data").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.collection, t.id] }), index("records_updated_at_idx").on(t.updatedAt)],
)

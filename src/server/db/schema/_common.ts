import { integer, text } from "drizzle-orm/sqlite-core"

/** Shared column helpers for agency-scoped entities (multi-tenant ready). */
export const agencyIdColumn = () =>
  text("agency_id").notNull()

/** Standard created/updated timestamps stored as epoch ms. */
export const timestampColumns = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
} as const

export const softDeleteColumn = () =>
  integer("deleted_at", { mode: "timestamp_ms" })

export const idColumn = () => text("id").primaryKey()

export const uuidDefault = () =>
  crypto.randomUUID()

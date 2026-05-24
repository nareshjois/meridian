import { drizzle } from "drizzle-orm/d1"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { env } from "cloudflare:workers"

import * as schema from "./schema/index.ts"

let db: DrizzleD1Database<typeof schema> | null = null

export function getD1Db() {
  if (!db) {
    db = drizzle(env.DB, { schema })
  }

  return db
}

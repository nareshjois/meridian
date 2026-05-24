import type { DrizzleD1Database } from "drizzle-orm/d1"

import type * as schema from "./schema/index.ts"

/** Stub used during local Node builds so cloudflare:workers is never bundled. */
export function getD1Db(): DrizzleD1Database<typeof schema> {
  throw new Error("D1 driver is unavailable in local Node builds.")
}

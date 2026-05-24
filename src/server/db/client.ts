import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"

import { isD1Driver } from "./driver.ts"
import * as schema from "./schema/index.ts"

/** Canonical app DB type (sqlite driver). D1 instances are cast at the boundary. */
export type MeridianDb = BetterSQLite3Database<typeof schema>

let dbInstance: MeridianDb | null = null

export async function initDb(): Promise<void> {
  if (dbInstance) {
    return
  }

  if (isD1Driver()) {
    const { getD1Db } = await import("@meridian/db-d1")
    dbInstance = getD1Db() as unknown as MeridianDb
    return
  }

  const { getSqliteDb } = await import("@meridian/db-sqlite")
  dbInstance = getSqliteDb()
}

export function getDb(): MeridianDb {
  if (!dbInstance) {
    throw new Error("Database is not initialized. Call initDb() first.")
  }

  return dbInstance
}

export function closeDb() {
  if (isD1Driver()) {
    dbInstance = null
    return
  }

  void import("@meridian/db-sqlite").then(({ closeSqliteDb }) => {
    closeSqliteDb()
  })
  dbInstance = null
}

export { isD1Driver, resolveDbDriver } from "./driver.ts"
export type { DbDriver } from "./driver.ts"

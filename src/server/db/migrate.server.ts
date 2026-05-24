import path from "node:path"
import { fileURLToPath } from "node:url"

import { migrate } from "drizzle-orm/better-sqlite3/migrator"

import { getDb } from "./client"

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
)

let migrated = false

export async function ensureDatabaseMigrated() {
  if (migrated) {
    return
  }

  migrate(getDb(), { migrationsFolder })
  migrated = true
}

export function resetMigrationStateForTests() {
  migrated = false
}

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import path from "node:path"
import { fileURLToPath } from "node:url"

import * as schema from "@/server/db/schema"
import type { MeridianDb } from "@/server/db/client"
import {
  DEFAULT_DEV_ADMIN,
  DEFAULT_DEV_AGENCY,
  ensureDevSeed,
} from "@/server/services/users"
import { createMeridianServices } from "@/server/services/registry"
import { createServiceContext } from "@/server/auth/session"
import type { SessionDto } from "@/shared/validation/dtos/auth"
import { PERMISSION_KEYS } from "@/shared/permissions"

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations",
)

export function createTestDb(): MeridianDb {
  const sqlite = new Database(":memory:")
  sqlite.pragma("foreign_keys = ON")
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })
  return db
}

export async function seedTestAgency(db: MeridianDb) {
  await ensureDevSeed(db)
}

export async function loginAsAdmin(db: MeridianDb): Promise<SessionDto> {
  const { auth } = createMeridianServices(db)
  const result = await auth.login({
    email: DEFAULT_DEV_ADMIN.email,
    password: DEFAULT_DEV_ADMIN.password,
  })

  if (!result.ok) {
    throw new Error(result.error.message)
  }

  return result.data
}

export function adminContext(session: SessionDto) {
  return createServiceContext(session)
}

export { createMeridianServices } from "@/server/services/registry"
export { DEFAULT_DEV_ADMIN, DEFAULT_DEV_AGENCY, PERMISSION_KEYS }

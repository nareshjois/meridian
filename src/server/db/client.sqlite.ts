import { mkdirSync } from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"

import * as schema from "./schema/index.ts"

const defaultDatabasePath = "./data/meridian.sqlite"

function resolveDatabasePath() {
  return process.env.DATABASE_URL ?? defaultDatabasePath
}

function ensureDatabaseDirectory(databasePath: string) {
  if (databasePath === ":memory:" || databasePath.startsWith("file:")) {
    return
  }

  const directory = path.dirname(databasePath)
  if (directory && directory !== ".") {
    mkdirSync(directory, { recursive: true })
  }
}

let sqlite: Database.Database | null = null
let db: BetterSQLite3Database<typeof schema> | null = null

export function getSqlite() {
  if (!sqlite) {
    const databasePath = resolveDatabasePath()
    ensureDatabaseDirectory(databasePath)
    sqlite = new Database(databasePath)
    sqlite.pragma("journal_mode = WAL")
    sqlite.pragma("foreign_keys = ON")
  }

  return sqlite
}

export function getSqliteDb() {
  if (!db) {
    db = drizzle(getSqlite(), { schema })
  }

  return db
}

export function closeSqliteDb() {
  sqlite?.close()
  sqlite = null
  db = null
}

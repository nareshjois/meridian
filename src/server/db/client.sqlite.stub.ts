/** Stub used during Cloudflare builds so better-sqlite3 is never bundled. */
export function getSqlite() {
  throw new Error("SQLite driver is unavailable in Cloudflare Workers builds.")
}

export function getSqliteDb() {
  throw new Error("SQLite driver is unavailable in Cloudflare Workers builds.")
}

export function closeSqliteDb() {
  // No-op for stub.
}

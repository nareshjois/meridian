export type DbDriver = "sqlite" | "d1"

export function resolveDbDriver(): DbDriver {
  return process.env.MERIDIAN_DB_DRIVER === "d1" ? "d1" : "sqlite"
}

export function isD1Driver(): boolean {
  return resolveDbDriver() === "d1"
}

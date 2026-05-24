/** Seeded dev admin — keep in sync with ensureDevSeed(). */
export const DEV_ADMIN_CREDENTIALS = {
  email: "admin@meridian.example",
  displayName: "Meridian Admin",
  password: "change-me-now",
} as const

export function getDevLoginPrefill() {
  if (import.meta.env.DEV) {
    return {
      email: DEV_ADMIN_CREDENTIALS.email,
      password: DEV_ADMIN_CREDENTIALS.password,
    }
  }

  return { email: "", password: "" }
}

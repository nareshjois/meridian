export const SESSION_COOKIE_NAME = "meridian_session"

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14

export const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

export const DEFAULT_ROLE_KEYS = {
  admin: "admin",
  staff: "staff",
  viewer: "viewer",
} as const

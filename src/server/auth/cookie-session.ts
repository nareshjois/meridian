import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server"

import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/server/services/users/constants"

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: Math.floor(SESSION_TTL_MS / 1000),
}

export function readSessionIdFromCookie(): string | undefined {
  return getCookie(SESSION_COOKIE_NAME)
}

export function writeSessionCookie(sessionId: string) {
  setCookie(SESSION_COOKIE_NAME, sessionId, cookieOptions)
}

export function clearSessionCookie() {
  deleteCookie(SESSION_COOKIE_NAME, { path: "/" })
}

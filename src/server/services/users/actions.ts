import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"

import {
  clearSessionCookie,
  readSessionIdFromCookie,
  writeSessionCookie,
} from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  activateInviteInputSchema,
  assignRoleInputSchema,
  inviteUserInputSchema,
  loginInputSchema,
  setUserStatusInputSchema,
} from "@/shared/validation/dtos/auth"
import type { SessionDto } from "@/shared/validation/dtos/auth"

function toActionError(error: ServiceError): RouteServiceError {
  return {
    code: error.code,
    message: error.message,
  }
}

async function getAuthServices() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()
  return getServicesImpl()
}

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => loginInputSchema.parse(payload))
  .handler(async ({ data }): Promise<RouteActionResult<SessionDto>> => {
    const { auth } = await getAuthServices()
    const result = await auth.login(data)

    if (!result.ok) {
      return { ok: false, error: toActionError(result.error) }
    }

    writeSessionCookie(result.data.sessionId)
    return { ok: true, data: result.data }
  })

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const sessionId = readSessionIdFromCookie()

  if (sessionId) {
    const { auth } = await getAuthServices()
    await auth.logout(sessionId)
  }

  clearSessionCookie()
  throw redirect({ to: "/auth/login" })
})

export const activateInviteFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => activateInviteInputSchema.parse(payload))
  .handler(async ({ data }): Promise<RouteActionResult<SessionDto>> => {
    const { users } = await getAuthServices()
    const result = await users.activateInvite(data)

    if (!result.ok) {
      return { ok: false, error: toActionError(result.error) }
    }

    writeSessionCookie(result.data.sessionId)
    return { ok: true, data: result.data }
  })

export const inviteUserFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => inviteUserInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { auth, users } = await getAuthServices()
    const sessionId = readSessionIdFromCookie()
    if (!sessionId) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const session = await auth.getSession(sessionId)
    if (!session.ok || !session.data) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const result = await users.inviteUser(createServiceContext(session.data), data)
    return result.ok
      ? { ok: true as const, data: result.data }
      : { ok: false as const, error: toActionError(result.error) }
  })

export const setUserStatusFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => setUserStatusInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { auth, users } = await getAuthServices()
    const sessionId = readSessionIdFromCookie()
    if (!sessionId) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const session = await auth.getSession(sessionId)
    if (!session.ok || !session.data) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const result = await users.setUserStatus(createServiceContext(session.data), data)
    return result.ok
      ? { ok: true as const, data: result.data }
      : { ok: false as const, error: toActionError(result.error) }
  })

export const assignRoleFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => assignRoleInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { auth, users } = await getAuthServices()
    const sessionId = readSessionIdFromCookie()
    if (!sessionId) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const session = await auth.getSession(sessionId)
    if (!session.ok || !session.data) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const result = await users.assignRole(createServiceContext(session.data), data)
    return result.ok
      ? { ok: true as const, data: result.data }
      : { ok: false as const, error: toActionError(result.error) }
  })

export const removeRoleFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => assignRoleInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { auth, users } = await getAuthServices()
    const sessionId = readSessionIdFromCookie()
    if (!sessionId) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const session = await auth.getSession(sessionId)
    if (!session.ok || !session.data) {
      return {
        ok: false as const,
        error: { code: "UNAUTHORIZED" as const, message: "Sign in required." },
      }
    }

    const result = await users.removeRole(createServiceContext(session.data), data)
    return result.ok
      ? { ok: true as const, data: result.data }
      : { ok: false as const, error: toActionError(result.error) }
  })

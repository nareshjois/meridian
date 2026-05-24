import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { userListQuerySchema } from "@/shared/validation/dtos/auth"

import type { RoleSummary } from "./repository"

async function requireAuthenticatedContext() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth } = getServicesImpl()
  const sessionId = readSessionIdFromCookie()
  if (!sessionId) {
    throw redirect({ to: "/auth/login" })
  }

  const session = await auth.getSession(sessionId)
  if (!session.ok || !session.data) {
    throw redirect({ to: "/auth/login" })
  }

  return {
    ctx: createServiceContext(session.data),
    users: getServicesImpl().users,
  }
}

export const loadUsersIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => userListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, users } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["users.read"])

    const result = await users.listUsers(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    const roles: RoleSummary[] = await users.listRolesForAgency(ctx.agencyId)

    return {
      data: {
        users: result.data,
        roles,
      },
    } satisfies AppLoaderResult<{
      users: (typeof result)["data"]
      roles: RoleSummary[]
    }>
  })

const loadUserDetailInputSchema = z.object({
  userId: z.string().uuid(),
})

export const loadUserDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => loadUserDetailInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { ctx, users } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["users.read"])

    const result = await users.getUserById(ctx, data.userId)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    const roles: RoleSummary[] = await users.listRolesForAgency(ctx.agencyId)

    return {
      data: {
        user: result.data,
        roles,
      },
    } satisfies AppLoaderResult<{
      user: (typeof result)["data"]
      roles: RoleSummary[]
    }>
  })

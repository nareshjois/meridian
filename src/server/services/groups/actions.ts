import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  groupMemberInputSchema,
  travelGroupCreateInputSchema,
} from "@/shared/validation/dtos/crm"
import { idSchema } from "@/shared/validation/common"

function toActionError(error: ServiceError): RouteServiceError {
  return {
    code: error.code,
    message: error.message,
  }
}

async function requireSessionContext() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth, groups } = getServicesImpl()
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

  return {
    ok: true as const,
    ctx: createServiceContext(session.data),
    groups,
  }
}

export const createGroupFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    travelGroupCreateInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.groups.createGroup(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

export const addGroupMemberFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => groupMemberInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.groups.addMember(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

const removeGroupMemberPayloadSchema = z.object({
  groupId: idSchema,
  customerId: idSchema,
})

export const removeGroupMemberFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    removeGroupMemberPayloadSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.groups.removeMember(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

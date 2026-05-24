import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  customerFamilyCreateInputSchema,
  customerFamilyMemberInputSchema,
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

  const { auth, customerFamilies } = getServicesImpl()
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
    customerFamilies,
  }
}

export const createCustomerFamilyFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    customerFamilyCreateInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.customerFamilies.createFamily(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

export const addFamilyMemberFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    customerFamilyMemberInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.customerFamilies.addMember(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

const removeFamilyMemberPayloadSchema = z.object({
  familyId: idSchema,
  customerId: idSchema,
})

export const removeFamilyMemberFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    removeFamilyMemberPayloadSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.customerFamilies.removeMember(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

const deleteFamilyPayloadSchema = z.object({
  familyId: idSchema,
})

export const deleteCustomerFamilyFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => deleteFamilyPayloadSchema.parse(payload))
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.customerFamilies.deleteFamily(
      session.ctx,
      data.familyId,
    )
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

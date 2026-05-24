import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  customerCreateInputSchema,
  customerUpdateInputSchema,
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

  const { auth, customers } = getServicesImpl()
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
    customers,
  }
}

export const createCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => customerCreateInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.customers.createCustomer(session.ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

const updateCustomerPayloadSchema = z.object({
  customerId: idSchema,
  input: customerUpdateInputSchema,
})

export const updateCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => updateCustomerPayloadSchema.parse(payload))
  .handler(async ({ data }) => {
    const session = await requireSessionContext()
    if (!session.ok) {
      return session
    }

    const result = await session.customers.updateCustomer(
      session.ctx,
      data.customerId,
      data.input,
    )
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

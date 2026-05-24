import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  vendorBillCreateInputSchema,
  vendorCreateInputSchema,
  vendorPaymentCreateInputSchema,
  vendorUpdateInputSchema,
} from "@/shared/validation/dtos/vendors"
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

  const { auth, vendors } = getServicesImpl()
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
    vendors,
  }
}

export const createVendorFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => vendorCreateInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { ctx, vendors } = await requireSessionContext()
    const result = await vendors.createVendor(ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

const updateVendorPayloadSchema = z.object({
  vendorId: idSchema,
  input: vendorUpdateInputSchema,
})

export const updateVendorFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => updateVendorPayloadSchema.parse(payload))
  .handler(async ({ data }) => {
    const { ctx, vendors } = await requireSessionContext()
    const result = await vendors.updateVendor(ctx, data.vendorId, data.input)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

export const createVendorBillFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => vendorBillCreateInputSchema.parse(payload))
  .handler(async ({ data }) => {
    const { ctx, vendors } = await requireSessionContext()
    const result = await vendors.createBill(ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

export const recordVendorPaymentFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    vendorPaymentCreateInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, vendors } = await requireSessionContext()
    const result = await vendors.recordPayment(ctx, data)
    return result.ok
      ? ({ ok: true as const, data: result.data } satisfies RouteActionResult<
          (typeof result)["data"]
        >)
      : ({ ok: false as const, error: toActionError(result.error) })
  })

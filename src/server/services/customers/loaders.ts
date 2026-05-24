import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { customerListQuerySchema } from "@/shared/validation/dtos/crm"
import { idSchema } from "@/shared/validation/common"

async function requireAuthenticatedContext() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth, customers } = getServicesImpl()
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
    customers,
  }
}

export const loadCustomersIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => customerListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, customers } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["customers.read"])

    const result = await customers.listCustomers(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        customers: result.data,
      },
    } satisfies AppLoaderResult<{
      customers: (typeof result)["data"]
    }>
  })

const loadCustomerDetailInputSchema = z.object({
  customerId: idSchema,
})

export const loadCustomerDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadCustomerDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, customers } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["customers.read"])

    const result = await customers.getCustomerById(ctx, data.customerId)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        customer: result.data,
      },
    } satisfies AppLoaderResult<{
      customer: (typeof result)["data"]
    }>
  })

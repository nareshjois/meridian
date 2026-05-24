import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { idSchema } from "@/shared/validation/common"

async function requireAuthenticatedContext() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth, customerFamilies, customers } = getServicesImpl()
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
    customerFamilies,
    customers,
  }
}

const familyListQuerySchema = z.object({
  search: z.string().trim().optional(),
})

export const loadCustomerFamiliesIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => familyListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, customerFamilies } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["customer_families.read"])

    const result = await customerFamilies.listFamilies(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        families: result.data,
      },
    } satisfies AppLoaderResult<{
      families: (typeof result)["data"]
    }>
  })

const loadFamilyDetailInputSchema = z.object({
  familyId: idSchema,
})

export const loadCustomerFamilyDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadFamilyDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, customerFamilies, customers } =
      await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["customer_families.read"])

    const familyResult = await customerFamilies.getFamilyDetail(
      ctx,
      data.familyId,
    )
    if (!familyResult.ok) {
      throw new Error(familyResult.error.message)
    }

    const membersResult = await customerFamilies.listMembers(ctx, data.familyId)
    if (!membersResult.ok) {
      throw new Error(membersResult.error.message)
    }

    const picker = await customers.listCustomers(ctx, {
      page: 1,
      pageSize: 50,
      sortDirection: "asc",
      status: "active",
    })
    const customerPicker =
      picker.ok && picker.data.items.length > 0
        ? picker.data.items.map((item) => ({
            id: item.id,
            displayName: item.displayName,
          }))
        : []

    return {
      data: {
        family: familyResult.data,
        members: membersResult.data,
        customerPicker,
      },
    } satisfies AppLoaderResult<{
      family: (typeof familyResult)["data"]
      members: (typeof membersResult)["data"]
      customerPicker: { id: string; displayName: string }[]
    }>
  })

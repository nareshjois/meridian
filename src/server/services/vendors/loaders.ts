import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import {
  vendorBillListQuerySchema,
  vendorListQuerySchema,
} from "@/shared/validation/dtos/vendors"
import { idSchema } from "@/shared/validation/common"

async function requireAuthenticatedContext() {
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

export const loadVendorsIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => vendorListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, vendors } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["vendors.read"])

    const result = await vendors.listVendors(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        vendors: result.data,
      },
    } satisfies AppLoaderResult<{
      vendors: (typeof result)["data"]
    }>
  })

const loadVendorDetailInputSchema = z.object({
  vendorId: idSchema,
  billsQuery: vendorBillListQuerySchema.optional(),
})

export const loadVendorDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadVendorDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, vendors } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["vendors.read"])

    const vendorResult = await vendors.getVendorById(ctx, data.vendorId)
    if (!vendorResult.ok) {
      throw new Error(vendorResult.error.message)
    }

    const billsQuery = data.billsQuery ?? { page: 1, pageSize: 25, sortDirection: "asc" as const }
    const billsResult = await vendors.listVendorBills(
      ctx,
      data.vendorId,
      billsQuery,
    )
    if (!billsResult.ok) {
      throw new Error(billsResult.error.message)
    }

    return {
      data: {
        vendor: vendorResult.data,
        bills: billsResult.data,
      },
    } satisfies AppLoaderResult<{
      vendor: (typeof vendorResult)["data"]
      bills: (typeof billsResult)["data"]
    }>
  })

const loadVendorBillDetailInputSchema = z.object({
  billId: idSchema,
})

export const loadVendorBillDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadVendorBillDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, vendors } = await requireAuthenticatedContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["vendor_bills.read"])

    const result = await vendors.getVendorBillById(ctx, data.billId)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        bill: result.data,
      },
    } satisfies AppLoaderResult<{
      bill: (typeof result)["data"]
    }>
  })

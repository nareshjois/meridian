import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { idSchema } from "@/shared/validation/common"
import { quoteListQuerySchema } from "@/shared/validation/dtos/commercial"
import { buildServiceSchemaMap } from "@/shared/commercial/service-schema-map"

import { getDb } from "@/server/db/client"

import { createBookingRepository } from "../bookings/repository"
import { requireCommercialContext } from "../commercial/auth-context"

export const loadQuotesIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => quoteListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["quotes.read"])

    const quotesResult = await services.quotes.listQuotes(ctx, query)

    if (!quotesResult.ok) {
      throw new Error(quotesResult.error.message)
    }

    return {
      data: {
        quotes: quotesResult.data,
      },
    } satisfies AppLoaderResult<{
      quotes: (typeof quotesResult)["data"]
    }>
  })

export const loadQuoteCreateFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["quotes.read"])

    const [customersResult, servicesResult, vendorsResult] = await Promise.all([
      services.customers.listCustomers(ctx, {
        page: 1,
        pageSize: 100,
        sortDirection: "asc",
      }),
      services.bookingServices.listServices(ctx, { includeInactive: false }),
      services.vendors.listVendors(ctx, {
        page: 1,
        pageSize: 100,
        sortDirection: "asc",
        status: "active",
      }),
    ])

    if (!customersResult.ok) {
      throw new Error(customersResult.error.message)
    }
    if (!servicesResult.ok) {
      throw new Error(servicesResult.error.message)
    }
    if (!vendorsResult.ok) {
      throw new Error(vendorsResult.error.message)
    }

    return {
      data: {
        customers: customersResult.data.items,
        bookingServices: servicesResult.data.items,
        vendors: vendorsResult.data.items,
      },
    } satisfies AppLoaderResult<{
      customers: (typeof customersResult)["data"]["items"]
      bookingServices: (typeof servicesResult)["data"]["items"]
      vendors: (typeof vendorsResult)["data"]["items"]
    }>
  },
)

const loadQuoteDetailInputSchema = z.object({
  quoteId: idSchema,
})

export const loadQuoteDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadQuoteDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["quotes.read"])

    const result = await services.quotes.getQuoteById(ctx, data.quoteId)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    const bookingRepo = createBookingRepository(getDb())
    const linked = await bookingRepo.findByQuoteId(ctx.agencyId, data.quoteId)
    const servicesResult = await services.bookingServices.listServices(ctx, {
      includeInactive: true,
    })
    if (!servicesResult.ok) {
      throw new Error(servicesResult.error.message)
    }

    return {
      data: {
        quote: result.data,
        linkedBookingId: linked?.id ?? null,
        serviceSchemas: buildServiceSchemaMap(servicesResult.data.items),
      },
    } satisfies AppLoaderResult<{
      quote: (typeof result)["data"]
      linkedBookingId: string | null
      serviceSchemas: ReturnType<typeof buildServiceSchemaMap>
    }>
  })

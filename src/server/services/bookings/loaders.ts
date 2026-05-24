import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { idSchema } from "@/shared/validation/common"
import { bookingListQuerySchema } from "@/shared/validation/dtos/commercial"
import { buildServiceSchemaMap } from "@/shared/commercial/service-schema-map"

import { requireCommercialContext } from "../commercial/auth-context"

export const loadBookingsIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => bookingListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["bookings.read"])

    const result = await services.bookings.listBookings(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: { bookings: result.data },
    } satisfies AppLoaderResult<{ bookings: (typeof result)["data"] }>
  })

export const loadBookingCreateFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["bookings.read"])

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

const loadBookingDetailInputSchema = z.object({
  bookingId: idSchema,
})

export const loadBookingDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadBookingDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, services } = await requireCommercialContext()
    assertPermission(ctx.permissions, PERMISSION_KEYS["bookings.read"])

    const [bookingResult, customersResult, servicesResult] = await Promise.all([
      services.bookings.getBookingById(ctx, data.bookingId),
      services.customers.listCustomers(ctx, {
        page: 1,
        pageSize: 100,
        sortDirection: "asc",
      }),
      services.bookingServices.listServices(ctx, { includeInactive: true }),
    ])

    if (!bookingResult.ok) {
      throw new Error(bookingResult.error.message)
    }
    if (!customersResult.ok) {
      throw new Error(customersResult.error.message)
    }
    if (!servicesResult.ok) {
      throw new Error(servicesResult.error.message)
    }

    return {
      data: {
        booking: bookingResult.data,
        customers: customersResult.data.items,
        serviceSchemas: buildServiceSchemaMap(servicesResult.data.items),
      },
    } satisfies AppLoaderResult<{
      booking: (typeof bookingResult)["data"]
      customers: (typeof customersResult)["data"]["items"]
      serviceSchemas: ReturnType<typeof buildServiceSchemaMap>
    }>
  })

import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import { idSchema } from "@/shared/validation/common"
import { bookingListQuerySchema } from "@/shared/validation/dtos/commercial"

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

    const [bookingResult, customersResult] = await Promise.all([
      services.bookings.getBookingById(ctx, data.bookingId),
      services.customers.listCustomers(ctx, {
        page: 1,
        pageSize: 100,
        sortDirection: "asc",
      }),
    ])

    if (!bookingResult.ok) {
      throw new Error(bookingResult.error.message)
    }
    if (!customersResult.ok) {
      throw new Error(customersResult.error.message)
    }

    return {
      data: {
        booking: bookingResult.data,
        customers: customersResult.data.items,
      },
    } satisfies AppLoaderResult<{
      booking: (typeof bookingResult)["data"]
      customers: (typeof customersResult)["data"]["items"]
    }>
  })

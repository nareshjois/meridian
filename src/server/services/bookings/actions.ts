import { createServerFn } from "@tanstack/react-start"

import type { Booking } from "@/server/db/schema/bookings"
import type { BookingTraveler } from "@/server/db/schema/bookings"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  assignBookingTravelerInputSchema,
  bookingStatusTransitionSchema,
  removeBookingTravelerInputSchema,
} from "@/shared/validation/dtos/commercial"

import { requireCommercialContext } from "../commercial/auth-context"

function toActionError(error: ServiceError): RouteServiceError {
  return { code: error.code, message: error.message }
}

export const transitionBookingStatusFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    bookingStatusTransitionSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<Booking>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookings.transitionBookingStatus(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

export const assignBookingTravelerFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    assignBookingTravelerInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<BookingTraveler>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookings.assignTraveler(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

export const removeBookingTravelerFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    removeBookingTravelerInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<{ success: true }>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookings.removeTraveler(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

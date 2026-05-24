import { createServerFn } from "@tanstack/react-start"

import type { Booking } from "@/server/db/schema/bookings"
import type { BookingTraveler } from "@/server/db/schema/bookings"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  assignBookingTravelerInputSchema,
  bookingCreateInputSchema,
  bookingItemFieldsUpdateSchema,
  bookingStatusTransitionSchema,
  removeBookingTravelerInputSchema,
} from "@/shared/validation/dtos/commercial"

import { requireCommercialContext } from "../commercial/auth-context"

function toActionError(error: ServiceError): RouteServiceError {
  return { code: error.code, message: error.message }
}

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    bookingCreateInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<{ bookingId: string }>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookings.createBooking(ctx, data)
    return result.ok
      ? { ok: true, data: { bookingId: result.data.id } }
      : { ok: false, error: toActionError(result.error) }
  })

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

export const updateBookingItemFieldsFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    bookingItemFieldsUpdateSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookings.updateBookingItemFields(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

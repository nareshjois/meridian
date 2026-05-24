import { createServerFn } from "@tanstack/react-start"

import type { BookingService } from "@/server/db/schema/booking-services"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  bookingServiceCreateInputSchema,
  bookingServiceUpdateFieldsInputSchema,
} from "@/shared/validation/dtos/commercial"
import { z } from "zod"

import { requireCommercialContext } from "../commercial/auth-context"

function toActionError(error: ServiceError): RouteServiceError {
  return { code: error.code, message: error.message }
}

const setServiceActiveSchema = z.object({
  serviceId: z.string().uuid(),
  isActive: z.boolean(),
})

export const createBookingServiceFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    bookingServiceCreateInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<BookingService>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookingServices.createService(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

export const setBookingServiceActiveFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => setServiceActiveSchema.parse(payload))
  .handler(async ({ data }): Promise<RouteActionResult<BookingService>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookingServices.setServiceActive(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

export const updateBookingServiceFieldsFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    bookingServiceUpdateFieldsInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<BookingService>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.bookingServices.updateServiceFields(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

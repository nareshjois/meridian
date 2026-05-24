import { createServerFn } from "@tanstack/react-start"

import type { QuoteDetail } from "@/server/services/commercial.contract"
import type { ServiceError } from "@/server/services/_types"
import type { RouteActionResult, RouteServiceError } from "@/shared/routes/contracts"
import {
  convertQuoteToBookingInputSchema,
  quoteCreateInputSchema,
  quoteStatusTransitionSchema,
} from "@/shared/validation/dtos/commercial"

import { requireCommercialContext } from "../commercial/auth-context"

function toActionError(error: ServiceError): RouteServiceError {
  return { code: error.code, message: error.message }
}

export const createQuoteFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => quoteCreateInputSchema.parse(payload))
  .handler(async ({ data }): Promise<RouteActionResult<{ quoteId: string }>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.quotes.createQuote(ctx, data)
    return result.ok
      ? { ok: true, data: { quoteId: result.data.id } }
      : { ok: false, error: toActionError(result.error) }
  })

export const transitionQuoteStatusFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    quoteStatusTransitionSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<QuoteDetail>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.quotes.transitionQuoteStatus(ctx, data)
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: toActionError(result.error) }
  })

export const convertQuoteToBookingFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    convertQuoteToBookingInputSchema.parse(payload),
  )
  .handler(async ({ data }): Promise<RouteActionResult<{ bookingId: string }>> => {
    const { ctx, services } = await requireCommercialContext()
    const result = await services.quotes.convertToBooking(ctx, data)
    return result.ok
      ? { ok: true, data: { bookingId: result.data.id } }
      : { ok: false, error: toActionError(result.error) }
  })

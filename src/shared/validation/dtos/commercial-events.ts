import { z } from "zod"

import { idSchema, moneyCentsSchema, nonEmptyStringSchema } from "../common"

/** Gate 2: accounting consumes these payloads from commercial workflows. */
export const COMMERCIAL_EVENT_TYPES = {
  quoteSent: "commercial.quote.sent",
  quoteAccepted: "commercial.quote.accepted",
  quoteDeclined: "commercial.quote.declined",
  quoteConverted: "commercial.quote.converted",
  bookingStatusChanged: "commercial.booking.status_changed",
  bookingConfirmed: "commercial.booking.confirmed",
} as const

export type CommercialEventType =
  (typeof COMMERCIAL_EVENT_TYPES)[keyof typeof COMMERCIAL_EVENT_TYPES]

const commercialEventBaseSchema = z.object({
  agencyId: idSchema,
  occurredAt: z.coerce.date(),
  actorUserId: idSchema,
})

export const quoteSentEventSchema = commercialEventBaseSchema.extend({
  eventType: z.literal(COMMERCIAL_EVENT_TYPES.quoteSent),
  quoteId: idSchema,
  customerId: idSchema,
  quoteNumber: nonEmptyStringSchema,
  currency: nonEmptyStringSchema,
  totalCents: moneyCentsSchema,
})
export type QuoteSentEvent = z.infer<typeof quoteSentEventSchema>

export const quoteAcceptedEventSchema = commercialEventBaseSchema.extend({
  eventType: z.literal(COMMERCIAL_EVENT_TYPES.quoteAccepted),
  quoteId: idSchema,
  customerId: idSchema,
  quoteNumber: nonEmptyStringSchema,
  totalCents: moneyCentsSchema,
})
export type QuoteAcceptedEvent = z.infer<typeof quoteAcceptedEventSchema>

export const quoteDeclinedEventSchema = commercialEventBaseSchema.extend({
  eventType: z.literal(COMMERCIAL_EVENT_TYPES.quoteDeclined),
  quoteId: idSchema,
  customerId: idSchema,
  quoteNumber: nonEmptyStringSchema,
  note: z.string().optional(),
})
export type QuoteDeclinedEvent = z.infer<typeof quoteDeclinedEventSchema>

export const quoteConvertedEventSchema = commercialEventBaseSchema.extend({
  eventType: z.literal(COMMERCIAL_EVENT_TYPES.quoteConverted),
  quoteId: idSchema,
  bookingId: idSchema,
  customerId: idSchema,
  bookingNumber: nonEmptyStringSchema,
  totalCents: moneyCentsSchema,
})
export type QuoteConvertedEvent = z.infer<typeof quoteConvertedEventSchema>

export const bookingStatusChangedEventSchema = commercialEventBaseSchema.extend({
  eventType: z.literal(COMMERCIAL_EVENT_TYPES.bookingStatusChanged),
  bookingId: idSchema,
  fromStatus: z.string().nullable(),
  toStatus: nonEmptyStringSchema,
  note: z.string().optional(),
})
export type BookingStatusChangedEvent = z.infer<
  typeof bookingStatusChangedEventSchema
>

export const bookingConfirmedEventSchema = commercialEventBaseSchema.extend({
  eventType: z.literal(COMMERCIAL_EVENT_TYPES.bookingConfirmed),
  bookingId: idSchema,
  customerId: idSchema,
  bookingNumber: nonEmptyStringSchema,
  currency: nonEmptyStringSchema,
  totalReceivableCents: moneyCentsSchema,
  /** Resolved at posting time; optional until chart mapping is wired. */
  revenueAccountId: idSchema.optional(),
  receivableAccountId: idSchema.optional(),
})
export type BookingConfirmedEvent = z.infer<typeof bookingConfirmedEventSchema>

export const commercialEventSchema = z.discriminatedUnion("eventType", [
  quoteSentEventSchema,
  quoteAcceptedEventSchema,
  quoteDeclinedEventSchema,
  quoteConvertedEventSchema,
  bookingStatusChangedEventSchema,
  bookingConfirmedEventSchema,
])
export type CommercialEvent = z.infer<typeof commercialEventSchema>

export function serializeCommercialEvent(event: CommercialEvent): string {
  return JSON.stringify(commercialEventSchema.parse(event))
}

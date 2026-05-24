import { z } from "zod"

import {
  createListQuerySchema,
  currencyCodeSchema,
  idSchema,
  moneyCentsSchema,
  nonEmptyStringSchema,
} from "../common"

export const bookingServiceCreateInputSchema = z.object({
  code: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  category: nonEmptyStringSchema,
  defaultRevenueAccountId: idSchema.optional(),
})
export type BookingServiceCreateInput = z.infer<
  typeof bookingServiceCreateInputSchema
>

export const quoteItemInputSchema = z.object({
  bookingServiceId: idSchema,
  description: nonEmptyStringSchema,
  quantity: z.number().int().min(1).default(1),
  unitPriceCents: moneyCentsSchema,
})
export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>

export const quoteCreateInputSchema = z.object({
  customerId: idSchema,
  currency: currencyCodeSchema.default("USD"),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemInputSchema).min(1),
})
export type QuoteCreateInput = z.infer<typeof quoteCreateInputSchema>

export const quoteStatusTransitionSchema = z.object({
  quoteId: idSchema,
  status: z.enum(["sent", "accepted", "declined", "expired"]),
  note: z.string().optional(),
})
export type QuoteStatusTransitionInput = z.infer<
  typeof quoteStatusTransitionSchema
>

export const convertQuoteToBookingInputSchema = z.object({
  quoteId: idSchema,
  groupId: idSchema.optional(),
})
export type ConvertQuoteToBookingInput = z.infer<
  typeof convertQuoteToBookingInputSchema
>

export const bookingStatusTransitionSchema = z.object({
  bookingId: idSchema,
  status: z.enum([
    "draft",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  note: z.string().optional(),
})
export type BookingStatusTransitionInput = z.infer<
  typeof bookingStatusTransitionSchema
>

export const quoteListQuerySchema = createListQuerySchema({
  customerId: idSchema.optional(),
  status: z
    .enum(["draft", "sent", "accepted", "declined", "expired"])
    .optional(),
})
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>

export const bookingListQuerySchema = createListQuerySchema({
  customerId: idSchema.optional(),
  status: z
    .enum(["draft", "confirmed", "in_progress", "completed", "cancelled"])
    .optional(),
})
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>

export const assignBookingTravelerInputSchema = z.object({
  bookingId: idSchema,
  customerId: idSchema,
  travelerRole: z.string().trim().min(1).default("traveler"),
})
export type AssignBookingTravelerInput = z.infer<
  typeof assignBookingTravelerInputSchema
>

export const removeBookingTravelerInputSchema = z.object({
  bookingId: idSchema,
  travelerId: idSchema,
})
export type RemoveBookingTravelerInput = z.infer<
  typeof removeBookingTravelerInputSchema
>

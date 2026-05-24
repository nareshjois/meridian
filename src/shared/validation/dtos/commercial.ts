import { z } from "zod"

import { bookingServiceFieldDefinitionSchema } from "@/shared/commercial/service-fields"
import {
  createListQuerySchema,
  defaultCurrencyCodeSchema,
  idSchema,
  moneyCentsSchema,
  nonEmptyStringSchema,
} from "../common"

export const bookingServiceFieldsInputSchema = z.object({
  quoteFields: z.array(bookingServiceFieldDefinitionSchema).default([]),
  bookingFields: z.array(bookingServiceFieldDefinitionSchema).default([]),
})
export type BookingServiceFieldsInput = z.infer<
  typeof bookingServiceFieldsInputSchema
>

export const bookingServiceCreateInputSchema = z.object({
  code: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  category: nonEmptyStringSchema,
  defaultRevenueAccountId: idSchema.optional(),
  quoteFields: z.array(bookingServiceFieldDefinitionSchema).optional(),
  bookingFields: z.array(bookingServiceFieldDefinitionSchema).optional(),
  sameStartEndDefault: z.boolean().optional(),
})
export type BookingServiceCreateInput = z.infer<
  typeof bookingServiceCreateInputSchema
>

export const bookingServiceUpdateFieldsInputSchema = z.object({
  serviceId: idSchema,
  quoteFields: z.array(bookingServiceFieldDefinitionSchema),
  bookingFields: z.array(bookingServiceFieldDefinitionSchema),
})
export type BookingServiceUpdateFieldsInput = z.infer<
  typeof bookingServiceUpdateFieldsInputSchema
>

export const bookingServiceScheduleConfigSchema = z.object({
  serviceId: idSchema,
  sameStartEndDefault: z.boolean(),
})
export type BookingServiceScheduleConfigInput = z.infer<
  typeof bookingServiceScheduleConfigSchema
>

const serviceFieldValuesSchema = z.record(z.string(), z.string())

export const commercialDocumentInputSchema = z.object({
  label: nonEmptyStringSchema,
  fileName: nonEmptyStringSchema,
  storageKey: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type CommercialDocumentInput = z.infer<
  typeof commercialDocumentInputSchema
>

export const vendorQuoteAttachmentInputSchema = z.object({
  vendorId: idSchema,
  label: nonEmptyStringSchema,
  vendorReference: z.string().trim().optional(),
  amountCents: moneyCentsSchema.optional(),
  currency: defaultCurrencyCodeSchema.optional(),
  fileName: z.string().trim().optional(),
  storageKey: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type VendorQuoteAttachmentInput = z.infer<
  typeof vendorQuoteAttachmentInputSchema
>

export const quoteItemInputSchema = z.object({
  bookingServiceId: idSchema,
  description: nonEmptyStringSchema,
  quantity: z.number().int().min(1).default(1),
  unitPriceCents: moneyCentsSchema,
  fields: serviceFieldValuesSchema.optional(),
})
export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>

export const bookingItemFieldsUpdateSchema = z.object({
  bookingId: idSchema,
  itemId: idSchema,
  fields: serviceFieldValuesSchema,
})
export type BookingItemFieldsUpdateInput = z.infer<
  typeof bookingItemFieldsUpdateSchema
>

export const bookingItemInputSchema = quoteItemInputSchema
export type BookingItemInput = z.infer<typeof bookingItemInputSchema>

export const bookingCreateInputSchema = z.object({
  customerId: idSchema,
  currency: defaultCurrencyCodeSchema,
  groupId: idSchema.optional(),
  items: z.array(bookingItemInputSchema).min(1),
  documents: z.array(commercialDocumentInputSchema).optional(),
  vendorQuotes: z.array(vendorQuoteAttachmentInputSchema).optional(),
})
export type BookingCreateInput = z.infer<typeof bookingCreateInputSchema>

export const quoteCreateInputSchema = z.object({
  customerId: idSchema,
  currency: defaultCurrencyCodeSchema,
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemInputSchema).min(1),
  documents: z.array(commercialDocumentInputSchema).optional(),
  vendorQuotes: z.array(vendorQuoteAttachmentInputSchema).optional(),
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

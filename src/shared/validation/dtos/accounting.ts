import { z } from "zod"

import {
  createListQuerySchema,
  idSchema,
  moneyCentsSchema,
  nonEmptyStringSchema,
} from "../common"

export const accountCreateInputSchema = z.object({
  code: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  normalBalance: z.enum(["debit", "credit"]),
  parentAccountId: idSchema.optional(),
})
export type AccountCreateInput = z.infer<typeof accountCreateInputSchema>

export const journalLineInputSchema = z.object({
  accountId: idSchema,
  debitCents: moneyCentsSchema.min(0).default(0),
  creditCents: moneyCentsSchema.min(0).default(0),
  memo: z.string().optional(),
})
export type JournalLineInput = z.infer<typeof journalLineInputSchema>

export const postJournalEntryInputSchema = z.object({
  entryDate: z.coerce.date(),
  memo: z.string().optional(),
  lines: z.array(journalLineInputSchema).min(2),
  sourceType: nonEmptyStringSchema,
  sourceId: idSchema,
  eventType: nonEmptyStringSchema,
})
export type PostJournalEntryInput = z.infer<typeof postJournalEntryInputSchema>

export const reverseJournalEntryInputSchema = z.object({
  entryId: idSchema,
  memo: z.string().optional(),
})
export type ReverseJournalEntryInput = z.infer<
  typeof reverseJournalEntryInputSchema
>

export const ledgerQuerySchema = createListQuerySchema({
  accountId: idSchema,
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
})
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>

export const trialBalanceQuerySchema = z.object({
  asOfDate: z.coerce.date().optional(),
})
export type TrialBalanceQuery = z.infer<typeof trialBalanceQuerySchema>

/** Business event payloads consumed by accounting integration (Gate 2). */
export const bookingConfirmedEventSchema = z.object({
  bookingId: idSchema,
  totalReceivableCents: moneyCentsSchema,
  revenueAccountId: idSchema,
  receivableAccountId: idSchema,
})
export type BookingConfirmedEvent = z.infer<typeof bookingConfirmedEventSchema>

export const vendorBillPostedEventSchema = z.object({
  vendorBillId: idSchema,
  totalPayableCents: moneyCentsSchema,
  expenseAccountId: idSchema,
  payableAccountId: idSchema,
})
export type VendorBillPostedEvent = z.infer<typeof vendorBillPostedEventSchema>

export const vendorPaymentRecordedEventSchema = z.object({
  vendorPaymentId: idSchema,
  amountCents: moneyCentsSchema,
  cashAccountId: idSchema,
  payableAccountId: idSchema,
})
export type VendorPaymentRecordedEvent = z.infer<
  typeof vendorPaymentRecordedEventSchema
>

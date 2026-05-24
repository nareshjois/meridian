/**
 * Payables accounting event contracts (Gate 2).
 * Consumed by AccountingService.handleVendorBillPosted / handleVendorPaymentRecorded.
 */
export type {
  VendorBillPostedEvent,
  VendorPaymentRecordedEvent,
} from "@/shared/validation/dtos/accounting"
export {
  vendorBillPostedEventSchema,
  vendorPaymentRecordedEventSchema,
} from "@/shared/validation/dtos/accounting"

import type { ServiceContext } from "@/server/services/_types"
import type { VendorBill, VendorBillItem, Vendor } from "@/server/db/schema/vendors"
import type {
  VendorBillPostedEvent,
  VendorPaymentRecordedEvent,
} from "@/shared/validation/dtos/accounting"
import {
  vendorBillPostedEventSchema,
  vendorPaymentRecordedEventSchema,
} from "@/shared/validation/dtos/accounting"

export function resolveBillExpenseAccountId(
  vendor: Pick<Vendor, "defaultExpenseAccountId">,
  items: Pick<VendorBillItem, "expenseAccountId">[],
): string | null {
  const fromItem = items.find((item) => item.expenseAccountId)?.expenseAccountId
  return fromItem ?? vendor.defaultExpenseAccountId ?? null
}

export function buildVendorBillPostedEvent(input: {
  bill: Pick<VendorBill, "id" | "totalCents">
  expenseAccountId: string
  payableAccountId: string
}): VendorBillPostedEvent {
  return vendorBillPostedEventSchema.parse({
    vendorBillId: input.bill.id,
    totalPayableCents: input.bill.totalCents,
    expenseAccountId: input.expenseAccountId,
    payableAccountId: input.payableAccountId,
  })
}

export function buildVendorPaymentRecordedEvent(input: {
  vendorPaymentId: string
  amountCents: number
  cashAccountId: string
  payableAccountId: string
}): VendorPaymentRecordedEvent {
  return vendorPaymentRecordedEventSchema.parse({
    vendorPaymentId: input.vendorPaymentId,
    amountCents: input.amountCents,
    cashAccountId: input.cashAccountId,
    payableAccountId: input.payableAccountId,
  })
}

export type PayablesAccountingPublisher = {
  onVendorBillPosted?: (
    ctx: ServiceContext,
    event: VendorBillPostedEvent,
  ) => Promise<void>
  onVendorPaymentRecorded?: (
    ctx: ServiceContext,
    event: VendorPaymentRecordedEvent,
  ) => Promise<void>
}

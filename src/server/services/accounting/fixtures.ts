import type { JournalLineInput } from "@/shared/validation/dtos/accounting"

import { CHART_ACCOUNT_IDS } from "./seed"

/** Deterministic scenario: $1,000 booking confirmation (AR + revenue). */
export const FIXTURE_BOOKING_RECEIVABLE_CENTS = 100_000

export function fixtureBookingConfirmedLines(
  amountCents = FIXTURE_BOOKING_RECEIVABLE_CENTS,
): JournalLineInput[] {
  return [
    {
      accountId: CHART_ACCOUNT_IDS.accountsReceivable,
      debitCents: amountCents,
      creditCents: 0,
    },
    {
      accountId: CHART_ACCOUNT_IDS.travelRevenue,
      debitCents: 0,
      creditCents: amountCents,
    },
  ]
}

/** Deterministic scenario: $500 vendor bill (expense + AP). */
export const FIXTURE_VENDOR_BILL_CENTS = 50_000

export function fixtureVendorBillLines(
  amountCents = FIXTURE_VENDOR_BILL_CENTS,
): JournalLineInput[] {
  return [
    {
      accountId: CHART_ACCOUNT_IDS.vendorExpense,
      debitCents: amountCents,
      creditCents: 0,
    },
    {
      accountId: CHART_ACCOUNT_IDS.accountsPayable,
      debitCents: 0,
      creditCents: amountCents,
    },
  ]
}

/** Expected trial balance totals after booking + vendor bill fixtures. */
export const FIXTURE_EXPECTED_TRIAL_BALANCE = {
  totalDebitsCents:
    FIXTURE_BOOKING_RECEIVABLE_CENTS + FIXTURE_VENDOR_BILL_CENTS,
  totalCreditsCents:
    FIXTURE_BOOKING_RECEIVABLE_CENTS + FIXTURE_VENDOR_BILL_CENTS,
  netDifferenceCents: 0,
} as const

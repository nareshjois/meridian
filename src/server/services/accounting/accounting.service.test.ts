import { describe, expect, it } from "vitest"

import { customers } from "@/server/db/schema/crm"
import { COMMERCIAL_EVENT_TYPES } from "@/shared/validation/dtos/commercial-events"
import {
  FIXTURE_BOOKING_RECEIVABLE_CENTS,
  FIXTURE_EXPECTED_TRIAL_BALANCE,
  FIXTURE_VENDOR_BILL_CENTS,
  fixtureBookingConfirmedLines,
  fixtureVendorBillLines,
} from "@/server/services/accounting/fixtures"
import { CHART_ACCOUNT_IDS } from "@/server/services/accounting/seed"
import { validateJournalLines } from "@/server/services/accounting/invariants"
import {
  adminContext,
  createMeridianServices,
  createTestDb,
  loginAsAdmin,
  seedTestAgency,
} from "@/server/services/users/test-helpers"

describe("accounting invariants", () => {
  it("rejects unbalanced journal lines", () => {
    const violation = validateJournalLines([
      { accountId: CHART_ACCOUNT_IDS.cash, debitCents: 100, creditCents: 0 },
      {
        accountId: CHART_ACCOUNT_IDS.travelRevenue,
        debitCents: 0,
        creditCents: 50,
      },
    ])
    expect(violation?.code).toBe("UNBALANCED")
  })

  it("rejects lines with both debit and credit", () => {
    const violation = validateJournalLines([
      { accountId: CHART_ACCOUNT_IDS.cash, debitCents: 100, creditCents: 100 },
      {
        accountId: CHART_ACCOUNT_IDS.travelRevenue,
        debitCents: 0,
        creditCents: 100,
      },
    ])
    expect(violation?.code).toBe("LINE_EXCLUSIVE")
  })

  it("accepts balanced fixture lines", () => {
    expect(validateJournalLines(fixtureBookingConfirmedLines())).toBeNull()
    expect(validateJournalLines(fixtureVendorBillLines())).toBeNull()
  })
})

describe("accounting service", () => {
  it("seeds chart of accounts idempotently", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    await seedTestAgency(db)

    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const { accounting } = createMeridianServices(db)

    const accounts = await accounting.listAccounts(ctx, {
      includeInactive: false,
    })
    expect(accounts.ok).toBe(true)
    if (accounts.ok) {
      expect(accounts.data.items.length).toBeGreaterThanOrEqual(5)
      expect(
        accounts.data.items.some(
          (row) => row.code === "1100" && row.id === CHART_ACCOUNT_IDS.accountsReceivable,
        ),
      ).toBe(true)
    }
  })

  it("posts manual entry and trial balance nets to zero", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const { accounting } = createMeridianServices(db)

    const posted = await accounting.postEntry(ctx, {
      entryDate: new Date(),
      memo: "Fixture manual post",
      sourceType: "manual",
      sourceId: crypto.randomUUID(),
      eventType: "manual.test",
      lines: fixtureBookingConfirmedLines(),
    })
    expect(posted.ok).toBe(true)

    const trialBalance = await accounting.getTrialBalance(ctx, {})
    expect(trialBalance.ok).toBe(true)
    if (trialBalance.ok) {
      expect(trialBalance.data.netDifferenceCents).toBe(0)
    }
  })

  it("reverses entry and blocks duplicate reversal", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const { accounting } = createMeridianServices(db)

    const posted = await accounting.postEntry(ctx, {
      entryDate: new Date(),
      sourceType: "manual",
      sourceId: crypto.randomUUID(),
      eventType: "manual.reverse-test",
      lines: fixtureVendorBillLines(25_000),
    })
    expect(posted.ok).toBe(true)
    if (!posted.ok) {
      return
    }

    const reversed = await accounting.reverseEntry(ctx, {
      entryId: posted.data.id,
    })
    expect(reversed.ok).toBe(true)

    const trialBalance = await accounting.getTrialBalance(ctx, {})
    expect(trialBalance.ok).toBe(true)
    if (trialBalance.ok) {
      expect(trialBalance.data.netDifferenceCents).toBe(0)
    }

    const duplicate = await accounting.reverseEntry(ctx, {
      entryId: posted.data.id,
    })
    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) {
      expect(duplicate.error.code).toBe("CONFLICT")
    }
  })

  it("handles booking confirmed event with idempotent posting", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const { accounting } = createMeridianServices(db)

    const customerId = crypto.randomUUID()
    const now = new Date()
    await db.insert(customers).values({
      id: customerId,
      agencyId: ctx.agencyId,
      displayName: "Ledger Customer",
      email: "ledger@example.com",
      phoneCountryCode: "+91",
      phone: null,
      address: null,
      city: null,
      state: null,
      countryCode: "IN",
      dateOfBirth: null,
      passportNumber: null,
      status: "active",
      notesSummary: null,
      createdAt: now,
      updatedAt: now,
    })

    const bookingId = crypto.randomUUID()
    const event = {
      agencyId: ctx.agencyId,
      occurredAt: now,
      actorUserId: ctx.actorUserId,
      eventType: COMMERCIAL_EVENT_TYPES.bookingConfirmed,
      bookingId,
      customerId,
      bookingNumber: "BK-FIXTURE-001",
      currency: "INR",
      totalReceivableCents: FIXTURE_BOOKING_RECEIVABLE_CENTS,
    }

    const first = await accounting.handleBookingConfirmed(ctx, event)
    const second = await accounting.handleBookingConfirmed(ctx, event)
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (first.ok && second.ok) {
      expect(second.data.id).toBe(first.data.id)
    }

    const ar = await accounting.getAccountsReceivableSummary(ctx, {})
    expect(ar.ok).toBe(true)
    if (ar.ok) {
      expect(ar.data.totalReceivableCents).toBe(FIXTURE_BOOKING_RECEIVABLE_CENTS)
    }
  })

  it("integrates vendor bill posting through registry publisher", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const { vendors, accounting } = createMeridianServices(db)

    const vendor = await vendors.createVendor(ctx, {
      name: "Integrated Supplier",
      defaultExpenseAccountId: CHART_ACCOUNT_IDS.vendorExpense,
    })
    expect(vendor.ok).toBe(true)
    if (!vendor.ok) {
      return
    }

    const bill = await vendors.createBill(ctx, {
      vendorId: vendor.data.id,
      billNumber: "INV-INT-001",
      currency: "INR",
      items: [
        {
          description: "Fixture bill",
          quantity: 1,
          unitCostCents: FIXTURE_VENDOR_BILL_CENTS,
        },
      ],
      payableAccountId: CHART_ACCOUNT_IDS.accountsPayable,
    })
    expect(bill.ok).toBe(true)

    const ap = await accounting.getAccountsPayableSummary(ctx, {})
    expect(ap.ok).toBe(true)
    if (ap.ok) {
      expect(ap.data.totalPayableCents).toBe(FIXTURE_VENDOR_BILL_CENTS)
    }
  })

  it("combines booking and vendor bill fixtures with balanced trial balance", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const { accounting } = createMeridianServices(db)

    await accounting.handleBookingConfirmed(ctx, {
      agencyId: ctx.agencyId,
      occurredAt: new Date(),
      actorUserId: ctx.actorUserId,
      eventType: COMMERCIAL_EVENT_TYPES.bookingConfirmed,
      bookingId: crypto.randomUUID(),
      customerId: crypto.randomUUID(),
      bookingNumber: "BK-COMBO",
      currency: "INR",
      totalReceivableCents: FIXTURE_BOOKING_RECEIVABLE_CENTS,
    })

    await accounting.handleVendorBillPosted(ctx, {
      vendorBillId: crypto.randomUUID(),
      totalPayableCents: FIXTURE_VENDOR_BILL_CENTS,
      expenseAccountId: CHART_ACCOUNT_IDS.vendorExpense,
      payableAccountId: CHART_ACCOUNT_IDS.accountsPayable,
    })

    const trialBalance = await accounting.getTrialBalance(ctx, {})
    expect(trialBalance.ok).toBe(true)
    if (trialBalance.ok) {
      expect(trialBalance.data.netDifferenceCents).toBe(
        FIXTURE_EXPECTED_TRIAL_BALANCE.netDifferenceCents,
      )

      const totalDebits = (
        trialBalance.data.rows as { debitBalanceCents: number }[]
      ).reduce((sum, row) => sum + row.debitBalanceCents, 0)
      const totalCredits = (
        trialBalance.data.rows as { creditBalanceCents: number }[]
      ).reduce((sum, row) => sum + row.creditBalanceCents, 0)
      expect(totalDebits).toBe(FIXTURE_EXPECTED_TRIAL_BALANCE.totalDebitsCents)
      expect(totalCredits).toBe(
        FIXTURE_EXPECTED_TRIAL_BALANCE.totalCreditsCents,
      )
    }
  })
})

import { describe, expect, it, vi } from "vitest"

import {
  adminContext,
  createTestDb,
  loginAsAdmin,
  seedTestAgency,
} from "@/server/services/users/test-helpers"
import {
  buildVendorBillPostedEvent,
  buildVendorPaymentRecordedEvent,
} from "@/server/services/vendors/payables-events"
import { createVendorService } from "@/server/services/vendors/vendor.service"

const EXPENSE_ACCOUNT_ID = "00000000-0000-4000-8000-000000000101"
const PAYABLE_ACCOUNT_ID = "00000000-0000-4000-8000-000000000201"
const CASH_ACCOUNT_ID = "00000000-0000-4000-8000-000000000301"

describe("vendor service", () => {
  it("creates vendor and lists with permission", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const vendors = createVendorService(db)

    const created = await vendors.createVendor(ctx, {
      name: "Acme Travel Supply",
      email: "billing@acme.example",
    })
    expect(created.ok).toBe(true)
    if (!created.ok) {
      return
    }

    const listed = await vendors.listVendors(ctx, {
      page: 1,
      pageSize: 25,
      sortDirection: "asc",
    })
    expect(listed.ok).toBe(true)
    if (!listed.ok) {
      return
    }

    expect(listed.data.items.some((v) => v.id === created.data.id)).toBe(true)
  })

  it("creates bill, posts when accounts provided, and records payment", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const billPosted = vi.fn()
    const paymentRecorded = vi.fn()
    const vendors = createVendorService(db, {
      onVendorBillPosted: billPosted,
      onVendorPaymentRecorded: paymentRecorded,
    })

    const vendor = await vendors.createVendor(ctx, {
      name: "Hotel Partners Ltd",
      defaultExpenseAccountId: EXPENSE_ACCOUNT_ID,
    })
    expect(vendor.ok).toBe(true)
    if (!vendor.ok) {
      return
    }

    const bill = await vendors.createBill(ctx, {
      vendorId: vendor.data.id,
      billNumber: "INV-1001",
      currency: "INR",
      items: [
        {
          description: "Group block deposit",
          quantity: 1,
          unitCostCents: 50_000,
        },
      ],
      payableAccountId: PAYABLE_ACCOUNT_ID,
    })
    expect(bill.ok).toBe(true)
    if (!bill.ok) {
      return
    }
    expect(bill.data.status).toBe("open")
    expect(billPosted).toHaveBeenCalledOnce()

    const payment = await vendors.recordPayment(ctx, {
      vendorId: vendor.data.id,
      vendorBillId: bill.data.id,
      amountCents: 50_000,
      paidAt: new Date(),
      cashAccountId: CASH_ACCOUNT_ID,
      payableAccountId: PAYABLE_ACCOUNT_ID,
    })
    expect(payment.ok).toBe(true)
    if (!payment.ok) {
      return
    }
    expect(paymentRecorded).toHaveBeenCalledOnce()

    const detail = await vendors.getVendorBillById(ctx, bill.data.id)
    expect(detail.ok).toBe(true)
    if (!detail.ok) {
      return
    }
    expect(detail.data.status).toBe("paid")
    expect(detail.data.paidCents).toBe(50_000)
  })

  it("rejects payment exceeding bill balance", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)
    const vendors = createVendorService(db)

    const vendor = await vendors.createVendor(ctx, {
      name: "Overpay Test Vendor",
      defaultExpenseAccountId: EXPENSE_ACCOUNT_ID,
    })
    expect(vendor.ok).toBe(true)
    if (!vendor.ok) {
      return
    }

    const bill = await vendors.createBill(ctx, {
      vendorId: vendor.data.id,
      billNumber: "INV-2002",
      currency: "INR",
      items: [{ description: "Service fee", quantity: 1, unitCostCents: 10_000 }],
      payableAccountId: PAYABLE_ACCOUNT_ID,
    })
    expect(bill.ok).toBe(true)
    if (!bill.ok) {
      return
    }

    const overpay = await vendors.recordPayment(ctx, {
      vendorId: vendor.data.id,
      vendorBillId: bill.data.id,
      amountCents: 20_000,
      paidAt: new Date(),
    })
    expect(overpay.ok).toBe(false)
    if (overpay.ok) {
      return
    }
    expect(overpay.error.code).toBe("VALIDATION_ERROR")
  })
})

describe("payables event builders", () => {
  it("builds vendor bill posted event", () => {
    const event = buildVendorBillPostedEvent({
      bill: { id: "00000000-0000-4000-8000-000000000401", totalCents: 12_500 },
      expenseAccountId: EXPENSE_ACCOUNT_ID,
      payableAccountId: PAYABLE_ACCOUNT_ID,
    })

    expect(event.vendorBillId).toBe("00000000-0000-4000-8000-000000000401")
    expect(event.totalPayableCents).toBe(12_500)
  })

  it("builds vendor payment recorded event", () => {
    const event = buildVendorPaymentRecordedEvent({
      vendorPaymentId: "00000000-0000-4000-8000-000000000501",
      amountCents: 5_000,
      cashAccountId: CASH_ACCOUNT_ID,
      payableAccountId: PAYABLE_ACCOUNT_ID,
    })

    expect(event.amountCents).toBe(5_000)
  })
})

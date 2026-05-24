import type { MeridianDb } from "@/server/db/client"
import type { VendorServiceContract } from "@/server/services/vendors.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"

import {
  buildVendorBillPostedEvent,
  buildVendorPaymentRecordedEvent,
  resolveBillExpenseAccountId,
  type PayablesAccountingPublisher,
} from "./payables-events"
import { createVendorRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createVendorService(
  db: MeridianDb,
  publisher: PayablesAccountingPublisher = {},
): VendorServiceContract {
  const repo = createVendorRepository(db)

  return {
    async listVendors(ctx, query) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["vendors.read"])) {
        return forbidden("Missing permission to list vendors.")
      }

      const result = await repo.listVendors(ctx.agencyId, query)
      return serviceOk({
        items: result.items,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      })
    },

    async getVendorById(ctx, vendorId) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["vendors.read"])) {
        return forbidden("Missing permission to view vendors.")
      }

      const vendor = await repo.findVendorById(ctx.agencyId, vendorId)
      if (!vendor) {
        return serviceErr({ code: "NOT_FOUND", message: "Vendor not found." })
      }

      return serviceOk(vendor)
    },

    async createVendor(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["vendors.write"])) {
        return forbidden("Missing permission to create vendors.")
      }

      const vendor = await repo.createVendor(ctx.agencyId, input)
      return serviceOk(vendor)
    },

    async updateVendor(ctx, vendorId, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["vendors.write"])) {
        return forbidden("Missing permission to update vendors.")
      }

      const vendor = await repo.updateVendor(ctx.agencyId, vendorId, input)
      if (!vendor) {
        return serviceErr({ code: "NOT_FOUND", message: "Vendor not found." })
      }

      return serviceOk(vendor)
    },

    async listVendorBills(ctx, vendorId, query) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["vendor_bills.read"])
      ) {
        return forbidden("Missing permission to list vendor bills.")
      }

      const vendor = await repo.findVendorById(ctx.agencyId, vendorId)
      if (!vendor) {
        return serviceErr({ code: "NOT_FOUND", message: "Vendor not found." })
      }

      const result = await repo.listVendorBills(ctx.agencyId, vendorId, query)
      return serviceOk({
        items: result.items,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      })
    },

    async getVendorBillById(ctx, billId) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["vendor_bills.read"])
      ) {
        return forbidden("Missing permission to view vendor bills.")
      }

      const detail = await repo.getBillDetail(ctx.agencyId, billId)
      if (!detail) {
        return serviceErr({ code: "NOT_FOUND", message: "Vendor bill not found." })
      }

      return serviceOk(detail)
    },

    async createBill(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["vendor_bills.write"])
      ) {
        return forbidden("Missing permission to create vendor bills.")
      }

      const created = await repo.createBill(ctx.agencyId, input)
      if ("error" in created) {
        return serviceErr({ code: "NOT_FOUND", message: "Vendor not found." })
      }

      const detail = await repo.getBillDetail(ctx.agencyId, created.bill.id)
      if (!detail) {
        return serviceErr({
          code: "INTERNAL_ERROR",
          message: "Failed to load created bill.",
        })
      }

      const expenseAccountId = resolveBillExpenseAccountId(
        created.vendor,
        detail.items,
      )
      const payableAccountId = input.payableAccountId

      if (expenseAccountId && payableAccountId) {
        const posted = await repo.setBillStatus(
          ctx.agencyId,
          created.bill.id,
          "open",
        )
        if (posted) {
          const event = buildVendorBillPostedEvent({
            bill: posted,
            expenseAccountId,
            payableAccountId,
          })
          await publisher.onVendorBillPosted?.(ctx, event)
        }
        return serviceOk(posted ?? created.bill)
      }

      return serviceOk(created.bill)
    },

    async recordPayment(ctx, input) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["vendor_payments.write"],
        )
      ) {
        return forbidden("Missing permission to record vendor payments.")
      }

      const vendor = await repo.findVendorById(ctx.agencyId, input.vendorId)
      if (!vendor) {
        return serviceErr({ code: "NOT_FOUND", message: "Vendor not found." })
      }

      if (input.vendorBillId) {
        const bill = await repo.findBillById(ctx.agencyId, input.vendorBillId)
        if (!bill) {
          return serviceErr({
            code: "NOT_FOUND",
            message: "Vendor bill not found.",
          })
        }
        if (bill.vendorId !== input.vendorId) {
          return serviceErr({
            code: "VALIDATION_ERROR",
            message: "Bill does not belong to this vendor.",
          })
        }
        if (bill.status === "draft" || bill.status === "void") {
          return serviceErr({
            code: "VALIDATION_ERROR",
            message: "Payments can only be applied to open or partially paid bills.",
          })
        }

        const paidSoFar = await repo.sumPaymentsForBill(bill.id)
        if (paidSoFar + input.amountCents > bill.totalCents) {
          return serviceErr({
            code: "VALIDATION_ERROR",
            message: "Payment exceeds remaining bill balance.",
          })
        }
      }

      const payment = await repo.createPayment(ctx.agencyId, input)

      if (input.vendorBillId) {
        await repo.refreshBillPaymentStatus(ctx.agencyId, input.vendorBillId)
      }

      const cashAccountId = input.cashAccountId
      const payableAccountId = input.payableAccountId
      if (cashAccountId && payableAccountId) {
        const event = buildVendorPaymentRecordedEvent({
          vendorPaymentId: payment.id,
          amountCents: payment.amountCents,
          cashAccountId,
          payableAccountId,
        })
        await publisher.onVendorPaymentRecorded?.(ctx, event)
      }

      return serviceOk(payment)
    },
  }
}

export type VendorService = ReturnType<typeof createVendorService>

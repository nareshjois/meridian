import type { MeridianDb } from "@/server/db/client"
import type { AccountingServiceContract } from "@/server/services/accounting.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type {
  BookingConfirmedEvent,
  PostJournalEntryInput,
  RepostJournalEntryInput,
  ReverseJournalEntryInput,
  VendorBillPostedEvent,
  VendorPaymentRecordedEvent,
} from "@/shared/validation/dtos/accounting"
import { COMMERCIAL_EVENT_TYPES } from "@/shared/validation/dtos/commercial-events"

import { CHART_ACCOUNT_IDS } from "./seed"
import { createPostingService } from "./posting.service"
import { createAccountingRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createAccountingService(
  db: MeridianDb,
): AccountingServiceContract {
  const repo = createAccountingRepository(db)
  const posting = createPostingService(db)

  return {
    async listAccounts(ctx, query) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.accounts.read"],
        )
      ) {
        return forbidden("Missing permission to list accounts.")
      }

      const items = await repo.listAccounts(
        ctx.agencyId,
        query.includeInactive ?? false,
      )

      return serviceOk({
        items,
        page: 1,
        pageSize: Math.max(items.length, 1),
        total: items.length,
      })
    },

    async createAccount(ctx, input) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.accounts.write"],
        )
      ) {
        return forbidden("Missing permission to create accounts.")
      }

      const account = await repo.createAccount(ctx.agencyId, input)
      return serviceOk(account)
    },

    async postEntry(ctx, input: PostJournalEntryInput) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.journals.post"],
        )
      ) {
        return forbidden("Missing permission to post journal entries.")
      }

      return posting.postJournal(ctx, {
        entryDate: input.entryDate,
        memo: input.memo,
        lines: input.lines,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        eventType: input.eventType,
      })
    },

    async reverseEntry(ctx, input: ReverseJournalEntryInput) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.journals.reverse"],
        )
      ) {
        return forbidden("Missing permission to reverse journal entries.")
      }

      return posting.reverseJournal(ctx, input.entryId, input.memo)
    },

    async repostEntry(ctx, input: RepostJournalEntryInput) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.journals.reverse"],
        ) ||
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.journals.post"],
        )
      ) {
        return forbidden("Missing permission to repost journal entries.")
      }

      const reversed = await posting.reverseJournal(
        ctx,
        input.entryId,
        input.memo ? `${input.memo} (reversal)` : undefined,
      )
      if (!reversed.ok) {
        return reversed
      }

      return posting.postJournal(ctx, {
        entryDate: input.entryDate,
        memo: input.memo,
        lines: input.lines,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        eventType: input.eventType,
      })
    },

    async listJournalEntries(ctx, query) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.journals.read"],
        )
      ) {
        return forbidden("Missing permission to read journals.")
      }

      const result = await repo.listJournalEntries(ctx.agencyId, query)
      return serviceOk({
        items: result.items,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      })
    },

    async getLedger(ctx, query) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.reports.read"],
        )
      ) {
        return forbidden("Missing permission to read accounting reports.")
      }

      const account = await repo.findAccountById(ctx.agencyId, query.accountId)
      if (!account) {
        return serviceErr({ code: "NOT_FOUND", message: "Account not found." })
      }

      const result = await repo.getLedgerLines(ctx.agencyId, query)
      return serviceOk(result)
    },

    async getTrialBalance(ctx, query) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.reports.read"],
        )
      ) {
        return forbidden("Missing permission to read accounting reports.")
      }

      const rows = await repo.getTrialBalanceRows(ctx.agencyId, query)
      const totalDebits = rows.reduce(
        (sum, row) => sum + row.debitBalanceCents,
        0,
      )
      const totalCredits = rows.reduce(
        (sum, row) => sum + row.creditBalanceCents,
        0,
      )

      return serviceOk({
        rows,
        netDifferenceCents: totalDebits - totalCredits,
      })
    },

    async getAccountsReceivableSummary(ctx, query) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.reports.read"],
        )
      ) {
        return forbidden("Missing permission to read accounting reports.")
      }

      const rows = await repo.getArSummaryRows(ctx.agencyId, query.asOfDate)
      const totalReceivableCents = rows.reduce(
        (sum, row) => sum + row.balanceCents,
        0,
      )

      return serviceOk({ rows, totalReceivableCents })
    },

    async getAccountsPayableSummary(ctx, query) {
      if (
        !hasPermission(
          ctx.permissions,
          PERMISSION_KEYS["accounting.reports.read"],
        )
      ) {
        return forbidden("Missing permission to read accounting reports.")
      }

      const rows = await repo.getApSummaryRows(ctx.agencyId, query.asOfDate)
      const totalPayableCents = rows.reduce(
        (sum, row) => sum + row.balanceCents,
        0,
      )

      return serviceOk({ rows, totalPayableCents })
    },

    async handleBookingConfirmed(ctx, event: BookingConfirmedEvent) {
      const receivableAccountId =
        event.receivableAccountId ?? CHART_ACCOUNT_IDS.accountsReceivable
      const revenueAccountId =
        event.revenueAccountId ?? CHART_ACCOUNT_IDS.travelRevenue

      return posting.postJournal(ctx, {
        entryDate: event.occurredAt,
        memo: `Booking ${event.bookingNumber} confirmed`,
        sourceType: "booking",
        sourceId: event.bookingId,
        eventType: COMMERCIAL_EVENT_TYPES.bookingConfirmed,
        lines: [
          {
            accountId: receivableAccountId,
            debitCents: event.totalReceivableCents,
            creditCents: 0,
          },
          {
            accountId: revenueAccountId,
            debitCents: 0,
            creditCents: event.totalReceivableCents,
          },
        ],
      })
    },

    async handleVendorBillPosted(ctx, event: VendorBillPostedEvent) {
      return posting.postJournal(ctx, {
        entryDate: new Date(),
        memo: `Vendor bill ${event.vendorBillId}`,
        sourceType: "vendor_bill",
        sourceId: event.vendorBillId,
        eventType: "vendor.bill.posted",
        lines: [
          {
            accountId: event.expenseAccountId,
            debitCents: event.totalPayableCents,
            creditCents: 0,
          },
          {
            accountId: event.payableAccountId,
            debitCents: 0,
            creditCents: event.totalPayableCents,
          },
        ],
      })
    },

    async handleVendorPaymentRecorded(
      ctx,
      event: VendorPaymentRecordedEvent,
    ) {
      return posting.postJournal(ctx, {
        entryDate: new Date(),
        memo: `Vendor payment ${event.vendorPaymentId}`,
        sourceType: "vendor_payment",
        sourceId: event.vendorPaymentId,
        eventType: "vendor.payment.recorded",
        lines: [
          {
            accountId: event.payableAccountId,
            debitCents: event.amountCents,
            creditCents: 0,
          },
          {
            accountId: event.cashAccountId,
            debitCents: 0,
            creditCents: event.amountCents,
          },
        ],
      })
    },
  }
}

export type AccountingService = ReturnType<typeof createAccountingService>

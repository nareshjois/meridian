import { createServerFn } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { z } from "zod"

import { readSessionIdFromCookie } from "@/server/auth/cookie-session"
import { createServiceContext } from "@/server/auth/session"
import { assertPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { AppLoaderResult } from "@/shared/routes/contracts"
import {
  apSummaryQuerySchema,
  arSummaryQuerySchema,
  journalListQuerySchema,
  ledgerQuerySchema,
  trialBalanceQuerySchema,
} from "@/shared/validation/dtos/accounting"
import { idSchema } from "@/shared/validation/common"

import type {
  ApSummaryRow,
  ArSummaryRow,
  JournalEntryListItem,
  LedgerLineRow,
  TrialBalanceRow,
} from "./repository"

async function requireAuthenticatedAccounting() {
  const { ensureUserDomainReadyImpl, getServicesImpl } = await import(
    "@/server/auth/bootstrap.impl.server"
  )
  await ensureUserDomainReadyImpl()

  const { auth, accounting } = getServicesImpl()
  const sessionId = readSessionIdFromCookie()
  if (!sessionId) {
    throw redirect({ to: "/auth/login" })
  }

  const session = await auth.getSession(sessionId)
  if (!session.ok || !session.data) {
    throw redirect({ to: "/auth/login" })
  }

  return {
    ctx: createServiceContext(session.data),
    accounting,
  }
}

export const loadAccountingHubFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )

    const accounts = await accounting.listAccounts(ctx, {
      includeInactive: false,
    })
    const trialBalance = await accounting.getTrialBalance(ctx, {})
    const journals = await accounting.listJournalEntries(ctx, {
      page: 1,
      pageSize: 5,
      sortDirection: "desc",
    })

    if (!accounts.ok || !trialBalance.ok || !journals.ok) {
      throw new Error("Failed to load accounting hub.")
    }

    return {
      data: {
        accountCount: accounts.data.total,
        netDifferenceCents: trialBalance.data.netDifferenceCents,
        recentEntries: journals.data.items as JournalEntryListItem[],
      },
    } satisfies AppLoaderResult<{
      accountCount: number
      netDifferenceCents: number
      recentEntries: JournalEntryListItem[]
    }>
  },
)

export const loadAccountsIndexFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.accounts.read"],
    )

    const result = await accounting.listAccounts(ctx, {
      includeInactive: true,
    })
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return { data: { accounts: result.data } } satisfies AppLoaderResult<{
      accounts: (typeof result)["data"]
    }>
  },
)

export const loadJournalIndexFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => journalListQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.journals.read"],
    )

    const result = await accounting.listJournalEntries(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        journals: {
          ...result.data,
          items: result.data.items as JournalEntryListItem[],
        },
      },
    } satisfies AppLoaderResult<{
      journals: {
        items: JournalEntryListItem[]
        page: number
        pageSize: number
        total: number
      }
    }>
  })

export const loadTrialBalanceFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    trialBalanceQuerySchema.parse(payload ?? {}),
  )
  .handler(async ({ data: query }) => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )

    const result = await accounting.getTrialBalance(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        rows: result.data.rows as TrialBalanceRow[],
        netDifferenceCents: result.data.netDifferenceCents,
      },
    } satisfies AppLoaderResult<{
      rows: TrialBalanceRow[]
      netDifferenceCents: number
    }>
  })

export const loadLedgerFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) => ledgerQuerySchema.parse(payload))
  .handler(async ({ data: query }) => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )

    const accounts = await accounting.listAccounts(ctx, {
      includeInactive: true,
    })
    const ledger = await accounting.getLedger(ctx, query)

    if (!accounts.ok || !ledger.ok) {
      throw new Error("Failed to load ledger.")
    }

    return {
      data: {
        accounts: accounts.data.items,
        ledger: {
          lines: ledger.data.lines as LedgerLineRow[],
          total: ledger.data.total,
        },
        query,
      },
    } satisfies AppLoaderResult<{
      accounts: (typeof accounts.data.items)
      ledger: { lines: LedgerLineRow[]; total: number }
      query: typeof query
    }>
  })

export const loadArSummaryFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    arSummaryQuerySchema.parse(payload ?? {}),
  )
  .handler(async ({ data: query }) => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )

    const result = await accounting.getAccountsReceivableSummary(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        rows: result.data.rows as ArSummaryRow[],
        totalReceivableCents: result.data.totalReceivableCents,
      },
    } satisfies AppLoaderResult<{
      rows: ArSummaryRow[]
      totalReceivableCents: number
    }>
  })

export const loadApSummaryFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    apSummaryQuerySchema.parse(payload ?? {}),
  )
  .handler(async ({ data: query }) => {
    const { ctx, accounting } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )

    const result = await accounting.getAccountsPayableSummary(ctx, query)
    if (!result.ok) {
      throw new Error(result.error.message)
    }

    return {
      data: {
        rows: result.data.rows as ApSummaryRow[],
        totalPayableCents: result.data.totalPayableCents,
      },
    } satisfies AppLoaderResult<{
      rows: ApSummaryRow[]
      totalPayableCents: number
    }>
  })

export const loadJournalDetailInputSchema = z.object({
  entryId: idSchema,
})

export const loadJournalDetailFn = createServerFn({ method: "POST" })
  .inputValidator((payload: unknown) =>
    loadJournalDetailInputSchema.parse(payload),
  )
  .handler(async ({ data }) => {
    const { ctx } = await requireAuthenticatedAccounting()
    assertPermission(
      ctx.permissions,
      PERMISSION_KEYS["accounting.journals.read"],
    )

    const { getDb } = await import("@/server/db/client")
    const { createAccountingRepository } = await import("./repository")
    const repository = createAccountingRepository(getDb())

    const entry = await repository.getEntryById(ctx.agencyId, data.entryId)
    if (!entry) {
      throw new Error("Journal entry not found.")
    }

    const lines = await repository.getEntryLines(ctx.agencyId, data.entryId)
    const source = await repository.findPostingSourceForEntry(
      ctx.agencyId,
      data.entryId,
    )

    return {
      data: { entry, lines, source },
    } satisfies AppLoaderResult<{
      entry: typeof entry
      lines: typeof lines
      source: typeof source
    }>
  })

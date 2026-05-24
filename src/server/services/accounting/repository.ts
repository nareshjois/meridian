import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  sum,
} from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import {
  accounts,
  journalBatches,
  journalEntries,
  journalLines,
  postingSources,
  type Account,
  type JournalEntry,
} from "@/server/db/schema/accounting"
import { bookings } from "@/server/db/schema/bookings"
import { customers } from "@/server/db/schema/crm"
import { vendorBills, vendors } from "@/server/db/schema/vendors"
import type {
  AccountCreateInput,
  JournalListQuery,
  LedgerQuery,
  TrialBalanceQuery,
} from "@/shared/validation/dtos/accounting"

export type JournalEntryListItem = {
  id: string
  entryNumber: string
  entryDate: Date
  memo: string | null
  reversalOfEntryId: string | null
  batchNumber: string
  totalDebitCents: number
  sourceType: string | null
  sourceId: string | null
  eventType: string | null
}

export type LedgerLineRow = {
  entryId: string
  entryNumber: string
  entryDate: Date
  memo: string | null
  debitCents: number
  creditCents: number
  runningBalanceCents: number
}

export type TrialBalanceRow = {
  accountId: string
  code: string
  name: string
  type: Account["type"]
  debitBalanceCents: number
  creditBalanceCents: number
}

export type ArSummaryRow = {
  sourceId: string
  sourceType: string
  customerId: string | null
  customerName: string | null
  bookingNumber: string | null
  balanceCents: number
}

export type ApSummaryRow = {
  sourceId: string
  vendorId: string | null
  vendorName: string | null
  billNumber: string | null
  balanceCents: number
}

export function createAccountingRepository(db: MeridianDb) {
  return {
    async listAccounts(agencyId: string, includeInactive: boolean) {
      const filters = [eq(accounts.agencyId, agencyId)]
      if (!includeInactive) {
        filters.push(eq(accounts.isActive, true))
      }

      return db
        .select()
        .from(accounts)
        .where(and(...filters))
        .orderBy(accounts.code)
    },

    async findAccountById(agencyId: string, accountId: string) {
      const [row] = await db
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.agencyId, agencyId), eq(accounts.id, accountId)),
        )
        .limit(1)
      return row ?? null
    },

    async findAccountsByIds(agencyId: string, accountIds: string[]) {
      if (accountIds.length === 0) {
        return []
      }

      return db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.agencyId, agencyId),
            inArray(accounts.id, accountIds),
          ),
        )
    },

    async createAccount(agencyId: string, input: AccountCreateInput) {
      const now = new Date()
      const id = crypto.randomUUID()
      await db.insert(accounts).values({
        id,
        agencyId,
        code: input.code.trim(),
        name: input.name.trim(),
        type: input.type,
        normalBalance: input.normalBalance,
        isActive: true,
        parentAccountId: input.parentAccountId ?? null,
        createdAt: now,
        updatedAt: now,
      })

      return (await this.findAccountById(agencyId, id))!
    },

    async findPostingSourceForEntry(agencyId: string, entryId: string) {
      const [row] = await db
        .select()
        .from(postingSources)
        .where(
          and(
            eq(postingSources.agencyId, agencyId),
            eq(postingSources.journalEntryId, entryId),
          ),
        )
        .limit(1)
      return row ?? null
    },

    async findPostingSource(
      agencyId: string,
      sourceType: string,
      sourceId: string,
      eventType: string,
    ) {
      const [row] = await db
        .select()
        .from(postingSources)
        .where(
          and(
            eq(postingSources.agencyId, agencyId),
            eq(postingSources.sourceType, sourceType),
            eq(postingSources.sourceId, sourceId),
            eq(postingSources.eventType, eventType),
          ),
        )
        .limit(1)
      return row ?? null
    },

    async findReversalForEntry(agencyId: string, entryId: string) {
      const [row] = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.agencyId, agencyId),
            eq(journalEntries.reversalOfEntryId, entryId),
          ),
        )
        .limit(1)
      return row ?? null
    },

    async getEntryById(agencyId: string, entryId: string) {
      const [row] = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.agencyId, agencyId),
            eq(journalEntries.id, entryId),
          ),
        )
        .limit(1)
      return row ?? null
    },

    async getEntryLines(agencyId: string, entryId: string) {
      return db
        .select()
        .from(journalLines)
        .where(
          and(
            eq(journalLines.agencyId, agencyId),
            eq(journalLines.entryId, entryId),
          ),
        )
    },

    async insertPostedEntry(input: {
      agencyId: string
      postedByUserId: string
      entryDate: Date
      memo?: string
      reversalOfEntryId?: string
      lines: {
        accountId: string
        debitCents: number
        creditCents: number
        memo?: string
      }[]
      source: {
        sourceType: string
        sourceId: string
        eventType: string
      }
    }): Promise<JournalEntry> {
      const now = new Date()
      const batchId = crypto.randomUUID()
      const entryId = crypto.randomUUID()
      const batchNumber = `JB-${now.getTime()}`
      const entryNumber = `JE-${now.getTime()}-${entryId.slice(0, 8)}`

      await db.insert(journalBatches).values({
        id: batchId,
        agencyId: input.agencyId,
        batchNumber,
        status: "posted",
        postedAt: now,
        postedByUserId: input.postedByUserId,
        memo: input.memo ?? null,
        createdAt: now,
        updatedAt: now,
      })

      await db.insert(journalEntries).values({
        id: entryId,
        agencyId: input.agencyId,
        batchId,
        entryNumber,
        entryDate: input.entryDate,
        memo: input.memo ?? null,
        reversalOfEntryId: input.reversalOfEntryId ?? null,
        createdAt: now,
        updatedAt: now,
      })

      for (const line of input.lines) {
        await db.insert(journalLines).values({
          id: crypto.randomUUID(),
          agencyId: input.agencyId,
          entryId,
          accountId: line.accountId,
          debitCents: line.debitCents,
          creditCents: line.creditCents,
          memo: line.memo ?? null,
          createdAt: now,
          updatedAt: now,
        })
      }

      await db.insert(postingSources).values({
        id: crypto.randomUUID(),
        agencyId: input.agencyId,
        sourceType: input.source.sourceType,
        sourceId: input.source.sourceId,
        journalEntryId: entryId,
        eventType: input.source.eventType,
        createdAt: now,
        updatedAt: now,
      })

      const [entry] = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.agencyId, input.agencyId),
            eq(journalEntries.id, entryId),
          ),
        )
        .limit(1)

      if (!entry) {
        throw new Error("Failed to load journal entry after posting.")
      }

      return entry
    },

    async listJournalEntries(agencyId: string, query: JournalListQuery) {
      const filters = [eq(journalEntries.agencyId, agencyId)]

      if (query.fromDate) {
        filters.push(gte(journalEntries.entryDate, query.fromDate))
      }
      if (query.toDate) {
        filters.push(lte(journalEntries.entryDate, query.toDate))
      }

      const whereClause = and(...filters)

      const [totalRow] = await db
        .select({ total: count() })
        .from(journalEntries)
        .where(whereClause)

      const entries = await db
        .select({
          id: journalEntries.id,
          entryNumber: journalEntries.entryNumber,
          entryDate: journalEntries.entryDate,
          memo: journalEntries.memo,
          reversalOfEntryId: journalEntries.reversalOfEntryId,
          batchNumber: journalBatches.batchNumber,
        })
        .from(journalEntries)
        .innerJoin(
          journalBatches,
          eq(journalEntries.batchId, journalBatches.id),
        )
        .where(whereClause)
        .orderBy(desc(journalEntries.entryDate))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)

      const items: JournalEntryListItem[] = []

      for (const entry of entries) {
        const [totals] = await db
          .select({
            totalDebitCents: sum(journalLines.debitCents),
          })
          .from(journalLines)
          .where(eq(journalLines.entryId, entry.id))

        const sourceFilters = [
          eq(postingSources.journalEntryId, entry.id),
          eq(postingSources.agencyId, agencyId),
        ]
        if (query.sourceType) {
          sourceFilters.push(eq(postingSources.sourceType, query.sourceType))
        }

        const [source] = await db
          .select({
            sourceType: postingSources.sourceType,
            sourceId: postingSources.sourceId,
            eventType: postingSources.eventType,
          })
          .from(postingSources)
          .where(and(...sourceFilters))
          .limit(1)

        items.push({
          id: entry.id,
          entryNumber: entry.entryNumber,
          entryDate: entry.entryDate,
          memo: entry.memo,
          reversalOfEntryId: entry.reversalOfEntryId,
          batchNumber: entry.batchNumber,
          totalDebitCents: Number(totals?.totalDebitCents ?? 0),
          sourceType: source?.sourceType ?? null,
          sourceId: source?.sourceId ?? null,
          eventType: source?.eventType ?? null,
        })
      }

      return {
        items,
        total: totalRow?.total ?? 0,
      }
    },

    async getLedgerLines(agencyId: string, query: LedgerQuery) {
      const filters = [
        eq(journalLines.agencyId, agencyId),
        eq(journalLines.accountId, query.accountId),
      ]

      if (query.fromDate) {
        filters.push(gte(journalEntries.entryDate, query.fromDate))
      }
      if (query.toDate) {
        filters.push(lte(journalEntries.entryDate, query.toDate))
      }

      const rows = await db
        .select({
          entryId: journalEntries.id,
          entryNumber: journalEntries.entryNumber,
          entryDate: journalEntries.entryDate,
          memo: journalLines.memo,
          debitCents: journalLines.debitCents,
          creditCents: journalLines.creditCents,
        })
        .from(journalLines)
        .innerJoin(
          journalEntries,
          eq(journalLines.entryId, journalEntries.id),
        )
        .where(and(...filters))
        .orderBy(journalEntries.entryDate, journalEntries.entryNumber)

      const account = await this.findAccountById(agencyId, query.accountId)
      let running = 0
      const lines: LedgerLineRow[] = []

      for (const row of rows) {
        const delta =
          account?.normalBalance === "debit"
            ? row.debitCents - row.creditCents
            : row.creditCents - row.debitCents
        running += delta
        lines.push({
          entryId: row.entryId,
          entryNumber: row.entryNumber,
          entryDate: row.entryDate,
          memo: row.memo,
          debitCents: row.debitCents,
          creditCents: row.creditCents,
          runningBalanceCents: running,
        })
      }

      return { lines, total: lines.length }
    },

    async getTrialBalanceRows(agencyId: string, query: TrialBalanceQuery) {
      const dateFilter = query.asOfDate
        ? lte(journalEntries.entryDate, query.asOfDate)
        : undefined

      const accountRows = await db
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.agencyId, agencyId), eq(accounts.isActive, true)),
        )
        .orderBy(accounts.code)

      const rows: TrialBalanceRow[] = []

      for (const account of accountRows) {
        const filters = [
          eq(journalLines.agencyId, agencyId),
          eq(journalLines.accountId, account.id),
        ]

        const [totals] = await db
          .select({
            debitTotal: sum(journalLines.debitCents),
            creditTotal: sum(journalLines.creditCents),
          })
          .from(journalLines)
          .innerJoin(
            journalEntries,
            eq(journalLines.entryId, journalEntries.id),
          )
          .where(
            dateFilter
              ? and(...filters, dateFilter)
              : and(...filters),
          )

        const debitTotal = Number(totals?.debitTotal ?? 0)
        const creditTotal = Number(totals?.creditTotal ?? 0)
        const net =
          account.normalBalance === "debit"
            ? debitTotal - creditTotal
            : creditTotal - debitTotal

        rows.push({
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debitBalanceCents:
            account.normalBalance === "debit"
              ? Math.max(net, 0)
              : Math.max(-net, 0),
          creditBalanceCents:
            account.normalBalance === "credit"
              ? Math.max(net, 0)
              : Math.max(-net, 0),
        })
      }

      return rows
    },

    async getArSummaryRows(agencyId: string, asOfDate?: Date) {
      const receivableAccounts = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.agencyId, agencyId),
            eq(accounts.code, "1100"),
          ),
        )

      const receivableIds = receivableAccounts.map((row) => row.id)
      if (receivableIds.length === 0) {
        return []
      }

      const dateFilter = asOfDate
        ? lte(journalEntries.entryDate, asOfDate)
        : undefined

      const sources = await db
        .select({
          sourceId: postingSources.sourceId,
          sourceType: postingSources.sourceType,
          journalEntryId: postingSources.journalEntryId,
        })
        .from(postingSources)
        .where(
          and(
            eq(postingSources.agencyId, agencyId),
            eq(postingSources.sourceType, "booking"),
          ),
        )

      const rows: ArSummaryRow[] = []

      for (const source of sources) {
        const lineFilters = [
          eq(journalLines.agencyId, agencyId),
          eq(journalLines.entryId, source.journalEntryId),
          inArray(journalLines.accountId, receivableIds),
        ]

        const [balance] = await db
          .select({
            balance: sql<number>`coalesce(sum(${journalLines.debitCents} - ${journalLines.creditCents}), 0)`,
          })
          .from(journalLines)
          .innerJoin(
            journalEntries,
            eq(journalLines.entryId, journalEntries.id),
          )
          .where(
            dateFilter
              ? and(...lineFilters, dateFilter)
              : and(...lineFilters),
          )

        const balanceCents = Number(balance?.balance ?? 0)
        if (balanceCents === 0) {
          continue
        }

        const [booking] = await db
          .select({
            customerId: bookings.customerId,
            bookingNumber: bookings.bookingNumber,
          })
          .from(bookings)
          .where(
            and(
              eq(bookings.agencyId, agencyId),
              eq(bookings.id, source.sourceId),
            ),
          )
          .limit(1)

        let customerName: string | null = null
        if (booking?.customerId) {
          const [customer] = await db
            .select({ displayName: customers.displayName })
            .from(customers)
            .where(eq(customers.id, booking.customerId))
            .limit(1)
          customerName = customer?.displayName ?? null
        }

        rows.push({
          sourceId: source.sourceId,
          sourceType: source.sourceType,
          customerId: booking?.customerId ?? null,
          customerName,
          bookingNumber: booking?.bookingNumber ?? null,
          balanceCents,
        })
      }

      return rows
    },

    async getApSummaryRows(agencyId: string, asOfDate?: Date) {
      const payableAccounts = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.agencyId, agencyId),
            eq(accounts.code, "2100"),
          ),
        )

      const payableIds = payableAccounts.map((row) => row.id)
      if (payableIds.length === 0) {
        return []
      }

      const dateFilter = asOfDate
        ? lte(journalEntries.entryDate, asOfDate)
        : undefined

      const sources = await db
        .select({
          sourceId: postingSources.sourceId,
          journalEntryId: postingSources.journalEntryId,
        })
        .from(postingSources)
        .where(
          and(
            eq(postingSources.agencyId, agencyId),
            eq(postingSources.sourceType, "vendor_bill"),
          ),
        )

      const rows: ApSummaryRow[] = []

      for (const source of sources) {
        const lineFilters = [
          eq(journalLines.agencyId, agencyId),
          eq(journalLines.entryId, source.journalEntryId),
          inArray(journalLines.accountId, payableIds),
        ]

        const [balance] = await db
          .select({
            balance: sql<number>`coalesce(sum(${journalLines.creditCents} - ${journalLines.debitCents}), 0)`,
          })
          .from(journalLines)
          .innerJoin(
            journalEntries,
            eq(journalLines.entryId, journalEntries.id),
          )
          .where(
            dateFilter
              ? and(...lineFilters, dateFilter)
              : and(...lineFilters),
          )

        const balanceCents = Number(balance?.balance ?? 0)
        if (balanceCents === 0) {
          continue
        }

        const [bill] = await db
          .select({
            vendorId: vendorBills.vendorId,
            billNumber: vendorBills.billNumber,
          })
          .from(vendorBills)
          .where(
            and(
              eq(vendorBills.agencyId, agencyId),
              eq(vendorBills.id, source.sourceId),
            ),
          )
          .limit(1)

        let vendorName: string | null = null
        if (bill?.vendorId) {
          const [vendor] = await db
            .select({ name: vendors.name })
            .from(vendors)
            .where(eq(vendors.id, bill.vendorId))
            .limit(1)
          vendorName = vendor?.name ?? null
        }

        rows.push({
          sourceId: source.sourceId,
          vendorId: bill?.vendorId ?? null,
          vendorName,
          billNumber: bill?.billNumber ?? null,
          balanceCents,
        })
      }

      return rows
    },
  }
}

export type AccountingRepository = ReturnType<typeof createAccountingRepository>

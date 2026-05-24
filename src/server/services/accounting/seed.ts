import { and, eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { accounts } from "@/server/db/schema/accounting"
import type { AccountCreateInput } from "@/shared/validation/dtos/accounting"

/** Stable IDs for tests and dev fixtures (agency-scoped rows use agency FK). */
export const CHART_ACCOUNT_IDS = {
  cash: "00000000-0000-4000-8000-000000000301",
  accountsReceivable: "00000000-0000-4000-8000-000000000101",
  accountsPayable: "00000000-0000-4000-8000-000000000201",
  travelRevenue: "00000000-0000-4000-8000-000000000401",
  vendorExpense: "00000000-0000-4000-8000-000000000501",
} as const

export const DEFAULT_CHART_OF_ACCOUNTS: readonly (AccountCreateInput & {
  id: string
})[] = [
  {
    id: CHART_ACCOUNT_IDS.cash,
    code: "1000",
    name: "Cash",
    type: "asset",
    normalBalance: "debit",
  },
  {
    id: CHART_ACCOUNT_IDS.accountsReceivable,
    code: "1100",
    name: "Accounts Receivable",
    type: "asset",
    normalBalance: "debit",
  },
  {
    id: CHART_ACCOUNT_IDS.accountsPayable,
    code: "2100",
    name: "Accounts Payable",
    type: "liability",
    normalBalance: "credit",
  },
  {
    id: CHART_ACCOUNT_IDS.travelRevenue,
    code: "4000",
    name: "Travel Revenue",
    type: "revenue",
    normalBalance: "credit",
  },
  {
    id: CHART_ACCOUNT_IDS.vendorExpense,
    code: "5000",
    name: "Vendor Expense",
    type: "expense",
    normalBalance: "debit",
  },
] as const

export async function ensureAccountingSeed(db: MeridianDb, agencyId: string) {
  const now = new Date()

  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(eq(accounts.agencyId, agencyId), eq(accounts.code, account.code)),
      )
      .limit(1)

    if (existing) {
      continue
    }

    await db.insert(accounts).values({
      id: account.id,
      agencyId,
      code: account.code,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      isActive: true,
      parentAccountId: null,
      createdAt: now,
      updatedAt: now,
    })
  }
}

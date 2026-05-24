import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useMemo } from "react"

import { loadLedgerFn } from "@/server/services/accounting/loaders"
import { CHART_ACCOUNT_IDS } from "@/server/services/accounting/seed"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"
import { formatMoneyCents } from "@/shared/currency"

export const Route = createFileRoute("/app/accounting/reports/ledger")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.reports.read"]],
  },
  validateSearch: (search: Record<string, unknown>) => ({
    accountId:
      typeof search.accountId === "string"
        ? search.accountId
        : CHART_ACCOUNT_IDS.cash,
  }) as { accountId: string },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ deps }) =>
    loadLedgerFn({
      data: {
        accountId: deps.search.accountId,
        page: 1,
        pageSize: 100,
        sortDirection: "asc",
      },
    }),
  component: LedgerPage,
})

function LedgerPage() {
  const { data } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()

  const selectedAccount = useMemo(
    () =>
      data.accounts.find(
        (account) =>
          (account as { id: string }).id === search.accountId,
      ) as { id: string; code: string; name: string } | undefined,
    [data.accounts, search.accountId],
  )

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">General ledger</h1>
        <p className="text-sm text-muted-foreground">
          {selectedAccount
            ? `${selectedAccount.code} — ${selectedAccount.name}`
            : "Select an account"}
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Account</span>
          <select
            name="accountId"
            defaultValue={search.accountId}
            className="h-10 min-w-[12rem] rounded-md border border-border bg-background px-3"
            onChange={(event) => {
              void router.navigate({
                to: "/app/accounting/reports/ledger",
                search: { accountId: event.target.value },
              })
            }}
          >
            {data.accounts.map((account) => {
              const row = account as { id: string; code: string; name: string }
              return (
                <option key={row.id} value={row.id}>
                  {row.code} — {row.name}
                </option>
              )
            })}
          </select>
        </label>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Entry</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium text-right">Debit</th>
              <th className="px-4 py-2 font-medium text-right">Credit</th>
              <th className="px-4 py-2 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.ledger.lines.map((line) => (
              <tr key={`${line.entryId}-${line.debitCents}-${line.creditCents}`} className="border-b border-border/60">
                <td className="px-4 py-2">{line.entryNumber}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(line.entryDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {line.debitCents > 0 ? formatMoneyCents(line.debitCents) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {line.creditCents > 0 ? formatMoneyCents(line.creditCents) : "—"}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatMoneyCents(line.runningBalanceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

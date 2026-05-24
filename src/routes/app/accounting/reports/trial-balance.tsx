import { createFileRoute } from "@tanstack/react-router"

import { cn } from "@/lib/utils"
import { loadTrialBalanceFn } from "@/server/services/accounting/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"
import { formatMoneyCents } from "@/shared/currency"

export const Route = createFileRoute("/app/accounting/reports/trial-balance")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.reports.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )
  },
  loader: () => loadTrialBalanceFn({ data: {} }),
  component: TrialBalancePage,
})

function TrialBalancePage() {
  const { data } = Route.useLoaderData()
  const balanced = data.netDifferenceCents === 0

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trial balance</h1>
        <p className="text-sm text-muted-foreground">
          Account balances as of today. Debits must equal credits.
        </p>
      </div>

      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          balanced
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-amber-500/40 bg-amber-500/10",
        )}
      >
        Net difference: {formatMoneyCents(data.netDifferenceCents)}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Account</th>
              <th className="px-4 py-2 font-medium text-right">Debit</th>
              <th className="px-4 py-2 font-medium text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const account = row as {
                code: string
                name: string
                debitBalanceCents: number
                creditBalanceCents: number
              }
              return (
                <tr key={account.code} className="border-b border-border/60">
                  <td className="px-4 py-2 font-mono">{account.code}</td>
                  <td className="px-4 py-2">{account.name}</td>
                  <td className="px-4 py-2 text-right">
                    {account.debitBalanceCents > 0
                      ? formatMoneyCents(account.debitBalanceCents)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {account.creditBalanceCents > 0
                      ? formatMoneyCents(account.creditBalanceCents)
                      : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

import { Link, createFileRoute } from "@tanstack/react-router"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { loadAccountingHubFn } from "@/server/services/accounting/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"

export const Route = createFileRoute("/app/accounting/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.reports.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )
  },
  loader: () => loadAccountingHubFn(),
  component: AccountingHubPage,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

function AccountingHubPage() {
  const { data } = Route.useLoaderData()
  const balanced = data.netDifferenceCents === 0

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Accounting</h1>
        <p className="text-sm text-muted-foreground">
          Double-entry ledger, journals, and financial reports.
        </p>
      </div>

      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          balanced
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
            : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
        )}
      >
        Trial balance net difference: {formatCents(data.netDifferenceCents)}
        {balanced ? " — books are balanced." : " — review journal entries."}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/app/accounting/accounts"
          className="rounded-lg border border-border p-4 hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Chart of accounts</p>
          <p className="text-2xl font-semibold">{data.accountCount}</p>
        </Link>
        <Link
          to="/app/accounting/journal"
          className="rounded-lg border border-border p-4 hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Journal entries</p>
          <p className="text-2xl font-semibold">{data.recentEntries.length}+</p>
        </Link>
        <Link
          to="/app/accounting/reports/trial-balance"
          className={cn(buttonVariants({ variant: "outline" }), "h-auto py-4")}
        >
          Trial balance report
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Reports</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/accounting/reports/ledger"
            search={{ accountId: "00000000-0000-4000-8000-000000000301" }}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            General ledger
          </Link>
          <Link
            to="/app/accounting/reports/ar"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            AR summary
          </Link>
          <Link
            to="/app/accounting/reports/ap"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            AP summary
          </Link>
        </div>
      </div>

      {data.recentEntries.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Recent journal entries</h2>
          <ul className="divide-y rounded-lg border border-border">
            {data.recentEntries.map((entry) => {
              const row = entry as {
                id: string
                entryNumber: string
                entryDate: Date
                totalDebitCents: number
              }
              return (
                <li key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link
                    to="/app/accounting/journal/$entryId"
                    params={{ entryId: row.id }}
                    className="font-medium hover:underline"
                  >
                    {row.entryNumber}
                  </Link>
                  <span className="text-muted-foreground">
                    {formatCents(row.totalDebitCents)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

import { createFileRoute } from "@tanstack/react-router"

import { loadApSummaryFn } from "@/server/services/accounting/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"
import { formatMoneyCents } from "@/shared/currency"

export const Route = createFileRoute("/app/accounting/reports/ap")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.reports.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )
  },
  loader: () => loadApSummaryFn({ data: {} }),
  component: ApSummaryPage,
})

function ApSummaryPage() {
  const { data } = Route.useLoaderData()

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Accounts payable
        </h1>
        <p className="text-sm text-muted-foreground">
          Open payables by vendor bill. Total:{" "}
          {formatMoneyCents(data.totalPayableCents)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Bill</th>
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                  No open payables.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => {
                const item = row as {
                  billNumber: string | null
                  vendorName: string | null
                  balanceCents: number
                  sourceId: string
                }
                return (
                  <tr
                    key={item.sourceId}
                    className="border-b border-border/60"
                  >
                    <td className="px-4 py-2">
                      {item.billNumber ?? item.sourceId}
                    </td>
                    <td className="px-4 py-2">{item.vendorName ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {formatMoneyCents(item.balanceCents)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

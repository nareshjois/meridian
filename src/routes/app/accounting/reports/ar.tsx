import { createFileRoute } from "@tanstack/react-router"

import { loadArSummaryFn } from "@/server/services/accounting/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"

export const Route = createFileRoute("/app/accounting/reports/ar")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.reports.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.reports.read"],
    )
  },
  loader: () => loadArSummaryFn({ data: {} }),
  component: ArSummaryPage,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

function ArSummaryPage() {
  const { data } = Route.useLoaderData()

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Accounts receivable
        </h1>
        <p className="text-sm text-muted-foreground">
          Open receivables by booking source. Total:{" "}
          {formatCents(data.totalReceivableCents)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Booking</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                  No open receivables.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => {
                const item = row as {
                  bookingNumber: string | null
                  customerName: string | null
                  balanceCents: number
                  sourceId: string
                }
                return (
                  <tr
                    key={item.sourceId}
                    className="border-b border-border/60"
                  >
                    <td className="px-4 py-2">
                      {item.bookingNumber ?? item.sourceId}
                    </td>
                    <td className="px-4 py-2">
                      {item.customerName ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCents(item.balanceCents)}
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

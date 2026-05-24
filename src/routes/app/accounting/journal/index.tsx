import { Link, createFileRoute } from "@tanstack/react-router"

import { loadJournalIndexFn } from "@/server/services/accounting/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"

export const Route = createFileRoute("/app/accounting/journal/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.journals.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.journals.read"],
    )
  },
  loader: () =>
    loadJournalIndexFn({
      data: { page: 1, pageSize: 50, sortDirection: "desc" },
    }),
  component: JournalIndexPage,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

function JournalIndexPage() {
  const { data } = Route.useLoaderData()

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="text-sm text-muted-foreground">
          Posted entries with source document links. Corrections use reversal
          entries only.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Entry</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.journals.items.map((entry) => (
              <tr key={entry.id} className="border-b border-border/60">
                <td className="px-4 py-2">
                  <Link
                    to="/app/accounting/journal/$entryId"
                    params={{ entryId: entry.id }}
                    className="font-medium hover:underline"
                  >
                    {entry.entryNumber}
                  </Link>
                  {entry.reversalOfEntryId ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (reversal)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(entry.entryDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {entry.sourceType
                    ? `${entry.sourceType} · ${entry.eventType ?? ""}`
                    : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCents(entry.totalDebitCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

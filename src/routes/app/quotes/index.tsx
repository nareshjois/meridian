import { Link, createFileRoute } from "@tanstack/react-router"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { loadQuotesIndexFn } from "@/server/services/quotes/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { quoteListQuerySchema } from "@/shared/validation/dtos/commercial"
import { formatMoneyCents } from "@/shared/currency"

export const Route = createFileRoute("/app/quotes/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["quotes.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    quoteListQuerySchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["quotes.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => loadQuotesIndexFn({ data: deps.search }),
  component: QuotesListPage,
})

function QuotesListPage() {
  const search = Route.useSearch()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["quotes.write"])

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Create quotes with service-typed line items and convert accepted
            quotes to bookings.
          </p>
        </div>
        {canWrite ? (
          <Link
            to="/app/quotes/new"
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            New quote
          </Link>
        ) : null}
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={search.status ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Quote</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.quotes.items.map((quote) => (
              <tr key={quote.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/quotes/$quoteId"
                    params={{ quoteId: quote.id }}
                    className="font-medium hover:underline"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{quote.customerDisplayName}</td>
                <td className="px-4 py-3 capitalize">{quote.status}</td>
                <td className="px-4 py-3">
                  {formatMoneyCents(quote.totalCents, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.quotes.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No quotes yet.
          </p>
        ) : null}
      </div>
    </section>
  )
}

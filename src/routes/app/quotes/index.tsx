import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { createQuoteFn } from "@/server/services/quotes/actions"
import { loadQuotesIndexFn } from "@/server/services/quotes/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { quoteListQuerySchema } from "@/shared/validation/dtos/commercial"

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

function formatMoney(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

function QuotesListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [customerId, setCustomerId] = useState(data.customers[0]?.id ?? "")
  const [serviceId, setServiceId] = useState(
    data.bookingServices[0]?.id ?? "",
  )
  const [description, setDescription] = useState("")
  const [unitPrice, setUnitPrice] = useState("100.00")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["quotes.write"])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite || !customerId || !serviceId) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const unitPriceCents = Math.round(parseFloat(unitPrice) * 100)
      const result = await createQuoteFn({
        data: {
          customerId,
          items: [
            {
              bookingServiceId: serviceId,
              description: description || "Line item",
              quantity: 1,
              unitPriceCents,
            },
          ],
        },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setDescription("")
      setMessage("Quote created.")
      await router.navigate({
        to: "/app/quotes/$quoteId",
        params: { quoteId: result.data.quoteId },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
        <p className="text-sm text-muted-foreground">
          Create quotes with service-typed line items and convert accepted quotes
          to bookings.
        </p>
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

      {canWrite && data.customers.length > 0 ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h2 className="font-medium">New quote</h2>
          <div className="flex flex-wrap gap-3">
            <select
              required
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              {data.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName}
                </option>
              ))}
            </select>
            <select
              required
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              {data.bookingServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              className="h-10 w-28 rounded-md border border-border bg-background px-3"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(buttonVariants(), "h-10")}
            >
              {isSubmitting ? "Creating..." : "Create quote"}
            </button>
          </div>
        </form>
      ) : canWrite ? (
        <p className="text-sm text-amber-700">
          Add a customer in CRM before creating quotes.
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

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
                  {formatMoney(quote.totalCents, quote.currency)}
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

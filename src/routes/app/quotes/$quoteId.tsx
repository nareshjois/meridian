import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  convertQuoteToBookingFn,
  transitionQuoteStatusFn,
} from "@/server/services/quotes/actions"
import { loadQuoteDetailFn } from "@/server/services/quotes/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/quotes/$quoteId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["quotes.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["quotes.read"])
  },
  loader: async ({ params }) =>
    loadQuoteDetailFn({ data: { quoteId: params.quoteId } }),
  component: QuoteDetailPage,
})

function formatMoney(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

function QuoteDetailPage() {
  const router = useRouter()
  const { quoteId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")

  const quote = data.quote
  const canWrite = hasPermission(permissions, PERMISSION_KEYS["quotes.write"])
  const canSend = hasPermission(permissions, PERMISSION_KEYS["quotes.send"])
  const canConvert = hasPermission(
    permissions,
    PERMISSION_KEYS["quotes.convert"],
  )

  async function transition(
    status: "sent" | "accepted" | "declined" | "expired",
  ) {
    setMessage("")
    const result = await transitionQuoteStatusFn({
      data: { quoteId, status },
    })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }
    setMessage(`Quote marked ${status}.`)
    await router.invalidate()
  }

  async function convertToBooking() {
    setMessage("")
    const result = await convertQuoteToBookingFn({ data: { quoteId } })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }
    await router.navigate({
      to: "/app/bookings/$bookingId",
      params: { bookingId: result.data.bookingId },
    })
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <Link
          to="/app/quotes"
          search={{ page: 1, pageSize: 25, sortDirection: "desc" }}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Quotes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {quote.quoteNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          {quote.customerDisplayName} ·{" "}
          <span className="capitalize">{quote.status}</span> ·{" "}
          {formatMoney(quote.totalCents, quote.currency)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {quote.status === "draft" && canSend ? (
          <button
            type="button"
            className={cn(buttonVariants(), "h-9")}
            onClick={() => void transition("sent")}
          >
            Mark sent
          </button>
        ) : null}
        {quote.status === "sent" && canWrite ? (
          <>
            <button
              type="button"
              className={cn(buttonVariants(), "h-9")}
              onClick={() => void transition("accepted")}
            >
              Accept
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-9")}
              onClick={() => void transition("declined")}
            >
              Decline
            </button>
          </>
        ) : null}
        {quote.status === "accepted" && canConvert && !data.linkedBookingId ? (
          <button
            type="button"
            className={cn(buttonVariants(), "h-9")}
            onClick={() => void convertToBooking()}
          >
            Convert to booking
          </button>
        ) : null}
        {data.linkedBookingId ? (
          <Link
            to="/app/bookings/$bookingId"
            params={{ bookingId: data.linkedBookingId }}
            className={cn(buttonVariants({ variant: "outline" }), "h-9")}
          >
            View booking
          </Link>
        ) : null}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  {formatMoney(item.unitPriceCents, quote.currency)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(
                    item.quantity * item.unitPriceCents,
                    quote.currency,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

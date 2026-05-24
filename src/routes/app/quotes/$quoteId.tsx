import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { InvoiceLineItemsTable } from "@/features/commercial/InvoiceLineItemsTable"
import { CommercialAttachmentsPanel } from "@/features/commercial/CommercialAttachmentsPanel"
import { cn } from "@/lib/utils"
import {
  transitionQuoteStatusFn,
} from "@/server/services/quotes/actions"
import { loadQuoteDetailFn } from "@/server/services/quotes/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { formatMoneyCents } from "@/shared/currency"

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
          {formatMoneyCents(quote.totalCents, quote.currency)}
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
          <Link
            to="/app/quotes/$quoteId/convert"
            params={{ quoteId }}
            className={cn(buttonVariants(), "h-9")}
          >
            Convert to booking
          </Link>
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

      <InvoiceLineItemsTable
        phase="quote"
        items={quote.items}
        currency={quote.currency}
        schemaMap={data.serviceSchemas}
      />

      <CommercialAttachmentsPanel
        documents={quote.documents}
        vendorQuotes={quote.vendorQuotes}
      />
    </section>
  )
}

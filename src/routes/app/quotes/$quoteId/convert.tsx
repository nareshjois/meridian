import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { InvoiceLineItemsTable } from "@/features/commercial/InvoiceLineItemsTable"
import { CommercialAttachmentsPanel } from "@/features/commercial/CommercialAttachmentsPanel"
import { convertQuoteToBookingFn } from "@/server/services/quotes/actions"
import { loadQuoteDetailFn } from "@/server/services/quotes/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { formatMoneyCents } from "@/shared/currency"

export const Route = createFileRoute("/app/quotes/$quoteId/convert")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["quotes.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["quotes.read"])
  },
  loader: async ({ params }) =>
    loadQuoteDetailFn({ data: { quoteId: params.quoteId } }),
  component: ConvertQuotePage,
})

function ConvertQuotePage() {
  const router = useRouter()
  const { quoteId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const quote = data.quote
  const canConvert = hasPermission(
    permissions,
    PERMISSION_KEYS["quotes.convert"],
  )

  async function handleConvert() {
    if (!canConvert) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await convertQuoteToBookingFn({ data: { quoteId } })
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      await router.navigate({
        to: "/app/bookings/$bookingId",
        params: { bookingId: result.data.bookingId },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed =
    quote.status === "accepted" && !data.linkedBookingId && canConvert

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/app/quotes/$quoteId"
          params={{ quoteId }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to quote
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Convert to booking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {quote.quoteNumber} · {quote.customerDisplayName} ·{" "}
          {formatMoneyCents(quote.totalCents, quote.currency)}
        </p>
      </div>

      {quote.status !== "accepted" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This quote must be accepted before it can be converted to a booking.
        </p>
      ) : null}

      {data.linkedBookingId ? (
        <div className="space-y-3 rounded-md border border-border p-4 text-sm">
          <p>This quote has already been converted to a booking.</p>
          <Link
            to="/app/bookings/$bookingId"
            params={{ bookingId: data.linkedBookingId }}
            className="font-medium hover:underline"
          >
            View booking
          </Link>
        </div>
      ) : null}

      <InvoiceLineItemsTable
        phase="quote"
        items={quote.items}
        currency={quote.currency}
        schemaMap={data.serviceSchemas}
      />

      <p className="text-sm text-muted-foreground">
        Start and end times, plus any custom fields, copy to the booking on
        conversion.
      </p>

      <CommercialAttachmentsPanel
        documents={quote.documents}
        vendorQuotes={quote.vendorQuotes}
      />

      {!canConvert ? (
        <p className="text-sm text-muted-foreground">
          You do not have permission to convert quotes to bookings.
        </p>
      ) : null}

      {canProceed ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleConvert()}
          >
            {isSubmitting ? "Converting..." : "Create booking from quote"}
          </Button>
          <Link
            to="/app/quotes/$quoteId"
            params={{ quoteId }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      ) : null}

      {message ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  )
}

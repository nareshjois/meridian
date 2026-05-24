import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { ServiceFieldValuesList } from "@/features/commercial/ServiceFieldValuesList"
import { cn } from "@/lib/utils"
import { parseFieldValuesJson } from "@/shared/commercial/service-fields"
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

      <div className="space-y-4">
        {quote.items.map((item) => {
          const schema = data.serviceSchemas[item.bookingServiceId]
          const values = parseFieldValuesJson(item.fieldsJson)

          return (
            <div
              key={item.id}
              className="rounded-lg border border-border p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.description}</p>
                  {schema ? (
                    <p className="text-xs text-muted-foreground">
                      {schema.name} ({schema.code})
                    </p>
                  ) : null}
                </div>
                <p>
                  {item.quantity} × {formatMoney(item.unitPriceCents, quote.currency)}{" "}
                  ={" "}
                  {formatMoney(
                    item.quantity * item.unitPriceCents,
                    quote.currency,
                  )}
                </p>
              </div>
              {schema ? (
                <ServiceFieldValuesList fields={schema.quoteFields} values={values} />
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

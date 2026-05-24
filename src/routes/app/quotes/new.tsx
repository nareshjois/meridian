import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import {
  CommercialCreateForm,
  type CommercialCreatePayload,
} from "@/features/commercial/CommercialCreateForm"
import { createQuoteFn } from "@/server/services/quotes/actions"
import { loadQuoteCreateFn } from "@/server/services/quotes/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/quotes/new")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["quotes.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["quotes.read"])
  },
  loader: async () => loadQuoteCreateFn(),
  component: NewQuotePage,
})

function NewQuotePage() {
  const router = useRouter()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["quotes.write"])

  async function handleCreate(payload: CommercialCreatePayload) {
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createQuoteFn({
        data: {
          customerId: payload.customerId,
          items: payload.items,
          documents: payload.documents,
          vendorQuotes: payload.vendorQuotes,
        },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      await router.navigate({
        to: "/app/quotes/$quoteId",
        params: { quoteId: result.data.quoteId },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canWrite) {
    return (
      <section className="space-y-4">
        <Link
          to="/app/quotes"
          search={{ page: 1, pageSize: 25, sortDirection: "desc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to quotes
        </Link>
        <p className="text-sm text-muted-foreground">
          You do not have permission to create quotes.
        </p>
      </section>
    )
  }

  return (
    <section className="w-full space-y-6">
      <div>
        <Link
          to="/app/quotes"
          search={{ page: 1, pageSize: 25, sortDirection: "desc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to quotes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">New quote</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add multiple services, documents, and vendor quotes in one quote.
        </p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <CommercialCreateForm
          phase="quote"
          customers={data.customers}
          bookingServices={data.bookingServices}
          vendors={data.vendors}
          isSubmitting={isSubmitting}
          message={message}
          onSubmit={handleCreate}
        />
      </div>
    </section>
  )
}

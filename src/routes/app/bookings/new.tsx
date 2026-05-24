import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import {
  CommercialCreateForm,
  type CommercialCreatePayload,
} from "@/features/commercial/CommercialCreateForm"
import { createBookingFn } from "@/server/services/bookings/actions"
import { loadBookingCreateFn } from "@/server/services/bookings/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/bookings/new")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["bookings.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["bookings.read"])
  },
  loader: async () => loadBookingCreateFn(),
  component: NewBookingPage,
})

function NewBookingPage() {
  const router = useRouter()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["bookings.write"])

  async function handleCreate(payload: CommercialCreatePayload) {
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createBookingFn({
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
        to: "/app/bookings/$bookingId",
        params: { bookingId: result.data.bookingId },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canWrite) {
    return (
      <section className="space-y-4">
        <Link
          to="/app/bookings"
          search={{ page: 1, pageSize: 25, sortDirection: "desc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to bookings
        </Link>
        <p className="text-sm text-muted-foreground">
          You do not have permission to create bookings.
        </p>
      </section>
    )
  }

  return (
    <section className="w-full space-y-6">
      <div>
        <Link
          to="/app/bookings"
          search={{ page: 1, pageSize: 25, sortDirection: "desc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to bookings
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">New booking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add multiple services, documents, and vendor quotes in one booking.
        </p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <CommercialCreateForm
          phase="booking"
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

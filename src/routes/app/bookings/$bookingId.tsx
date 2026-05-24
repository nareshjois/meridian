import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { BookingItemFieldsEditor } from "@/features/commercial/BookingItemFieldsEditor"
import { cn } from "@/lib/utils"
import {
  assignBookingTravelerFn,
  removeBookingTravelerFn,
  transitionBookingStatusFn,
} from "@/server/services/bookings/actions"
import { loadBookingDetailFn } from "@/server/services/bookings/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import type { BookingStatusTransitionInput } from "@/shared/validation/dtos/commercial"

export const Route = createFileRoute("/app/bookings/$bookingId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["bookings.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["bookings.read"])
  },
  loader: async ({ params }) =>
    loadBookingDetailFn({ data: { bookingId: params.bookingId } }),
  component: BookingDetailPage,
})

function formatMoney(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

function BookingDetailPage() {
  const router = useRouter()
  const { bookingId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [travelerCustomerId, setTravelerCustomerId] = useState(
    data.customers[0]?.id ?? "",
  )
  const [message, setMessage] = useState("")

  const booking = data.booking
  const canWrite = hasPermission(permissions, PERMISSION_KEYS["bookings.write"])
  const canConfirm = hasPermission(
    permissions,
    PERMISSION_KEYS["bookings.confirm"],
  )

  async function transition(
    status: BookingStatusTransitionInput["status"],
  ) {
    setMessage("")
    const result = await transitionBookingStatusFn({
      data: { bookingId, status },
    })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }
    setMessage(`Booking marked ${status.replace("_", " ")}.`)
    await router.invalidate()
  }

  async function handleAssignTraveler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite || !travelerCustomerId) {
      return
    }

    setMessage("")
    const result = await assignBookingTravelerFn({
      data: { bookingId, customerId: travelerCustomerId },
    })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }
    setMessage("Traveler assigned.")
    await router.invalidate()
  }

  async function removeTraveler(travelerId: string) {
    if (!canWrite) {
      return
    }

    setMessage("")
    const result = await removeBookingTravelerFn({
      data: { bookingId, travelerId },
    })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }
    await router.invalidate()
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <Link
          to="/app/bookings"
          search={{ page: 1, pageSize: 25, sortDirection: "desc" }}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Bookings
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {booking.bookingNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          {booking.customerDisplayName} ·{" "}
          <span className="capitalize">
            {booking.status.replace("_", " ")}
          </span>{" "}
          · {formatMoney(booking.totalCents, booking.currency)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {booking.status === "draft" && canConfirm ? (
          <button
            type="button"
            className={cn(buttonVariants(), "h-9")}
            onClick={() => void transition("confirmed")}
          >
            Confirm
          </button>
        ) : null}
        {booking.status === "confirmed" && canWrite ? (
          <button
            type="button"
            className={cn(buttonVariants(), "h-9")}
            onClick={() => void transition("in_progress")}
          >
            Start
          </button>
        ) : null}
        {booking.status === "in_progress" && canWrite ? (
          <button
            type="button"
            className={cn(buttonVariants(), "h-9")}
            onClick={() => void transition("completed")}
          >
            Complete
          </button>
        ) : null}
        {booking.status !== "cancelled" &&
        booking.status !== "completed" &&
        canWrite ? (
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "h-9")}
            onClick={() => void transition("cancelled")}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="space-y-4">
        {booking.items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border p-4 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium">{item.description}</p>
              <p>
                {item.quantity} ×{" "}
                {formatMoney(item.unitPriceCents, booking.currency)} ={" "}
                {formatMoney(
                  item.quantity * item.unitPriceCents,
                  booking.currency,
                )}
              </p>
            </div>
            <BookingItemFieldsEditor
              bookingId={bookingId}
              item={item}
              serviceSchema={data.serviceSchemas[item.bookingServiceId]}
              canWrite={canWrite}
              onSaved={() => router.invalidate()}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Travelers</h2>
        {canWrite && data.customers.length > 0 ? (
          <form
            onSubmit={handleAssignTraveler}
            className="flex flex-wrap gap-3"
          >
            <select
              value={travelerCustomerId}
              onChange={(event) => setTravelerCustomerId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              {data.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName}
                </option>
              ))}
            </select>
            <button type="submit" className={cn(buttonVariants(), "h-10")}>
              Assign traveler
            </button>
          </form>
        ) : null}
        <ul className="space-y-2 text-sm">
          {booking.travelers.map((traveler) => (
            <li
              key={traveler.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span>
                Customer {traveler.customerId.slice(0, 8)}… (
                {traveler.travelerRole})
              </span>
              {canWrite ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:underline"
                  onClick={() => void removeTraveler(traveler.id)}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
          {booking.travelers.length === 0 ? (
            <li className="text-muted-foreground">No travelers assigned.</li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Status history</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {booking.statusHistory.map((entry) => (
            <li key={entry.id}>
              {entry.fromStatus ?? "—"} → {entry.toStatus}
              {entry.note ? ` · ${entry.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

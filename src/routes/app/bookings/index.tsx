import { Link, createFileRoute } from "@tanstack/react-router"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { loadBookingsIndexFn } from "@/server/services/bookings/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"
import { bookingListQuerySchema } from "@/shared/validation/dtos/commercial"

export const Route = createFileRoute("/app/bookings/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["bookings.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    bookingListQuerySchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["bookings.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => loadBookingsIndexFn({ data: deps.search }),
  component: BookingsListPage,
})

function formatMoney(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toFixed(2)}`
}

function BookingsListPage() {
  const search = Route.useSearch()
  const { data } = Route.useLoaderData()

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Operational bookings converted from quotes with lifecycle tracking.
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
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.bookings.items.map((booking) => (
              <tr key={booking.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/bookings/$bookingId"
                    params={{ bookingId: booking.id }}
                    className="font-medium hover:underline"
                  >
                    {booking.bookingNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{booking.customerDisplayName}</td>
                <td className="px-4 py-3 capitalize">
                  {booking.status.replace("_", " ")}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(booking.totalCents, booking.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.bookings.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No bookings yet. Convert an accepted quote to create one.
          </p>
        ) : null}
      </div>
    </section>
  )
}

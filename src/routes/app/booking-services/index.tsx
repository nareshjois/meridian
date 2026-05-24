import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  createBookingServiceFn,
  setBookingServiceActiveFn,
} from "@/server/services/booking-services/actions"
import { loadBookingServicesIndexFn } from "@/server/services/booking-services/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/booking-services/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["booking_services.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["booking_services.read"],
    )
  },
  loader: async () => loadBookingServicesIndexFn(),
  component: BookingServicesPage,
})

function BookingServicesPage() {
  const router = useRouter()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("transport")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(
    permissions,
    PERMISSION_KEYS["booking_services.write"],
  )

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createBookingServiceFn({
        data: { code, name, category },
      })
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setCode("")
      setName("")
      setMessage("Booking service created.")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function toggleActive(serviceId: string, isActive: boolean) {
    if (!canWrite) {
      return
    }

    setMessage("")
    const result = await setBookingServiceActiveFn({
      data: { serviceId, isActive },
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Booking services
        </h1>
        <p className="text-sm text-muted-foreground">
          Master catalog for quote and booking line items (Flight, Train, Visa,
          etc.).
        </p>
      </div>

      {canWrite ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h2 className="font-medium">Add service</h2>
          <div className="flex flex-wrap gap-3">
            <input
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Code (e.g. FLIGHT)"
              className="h-10 rounded-md border border-border bg-background px-3"
            />
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Display name"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <input
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Category"
              className="h-10 rounded-md border border-border bg-background px-3"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(buttonVariants(), "h-10")}
            >
              {isSubmitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
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
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canWrite ? (
                <th className="px-4 py-3 font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.services.items.map((service) => (
              <tr key={service.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    to="/app/booking-services/$serviceId"
                    params={{ serviceId: service.id }}
                    className="hover:underline"
                  >
                    {service.code}
                  </Link>
                </td>
                <td className="px-4 py-3">{service.name}</td>
                <td className="px-4 py-3 capitalize">{service.category}</td>
                <td className="px-4 py-3 capitalize">
                  {service.isActive ? "Active" : "Inactive"}
                </td>
                {canWrite ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/app/booking-services/$serviceId"
                        params={{ serviceId: service.id }}
                        className={cn(buttonVariants({ variant: "outline" }), "h-8")}
                      >
                        Fields
                      </Link>
                      <button
                      type="button"
                      className={cn(buttonVariants({ variant: "outline" }), "h-8")}
                      onClick={() =>
                        void toggleActive(service.id, !service.isActive)
                      }
                    >
                      {service.isActive ? "Deactivate" : "Activate"}
                    </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {data.services.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No booking services yet.
          </p>
        ) : null}
      </div>
    </section>
  )
}

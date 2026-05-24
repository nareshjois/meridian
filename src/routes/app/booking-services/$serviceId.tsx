import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ServiceFieldSchemaEditor } from "@/features/commercial/ServiceFieldSchemaEditor"
import type { BookingServiceFieldDefinition } from "@/shared/commercial/service-fields"
import { updateBookingServiceFieldsFn, updateBookingServiceScheduleFn } from "@/server/services/booking-services/actions"
import { loadBookingServiceDetailFn } from "@/server/services/booking-services/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/booking-services/$serviceId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["booking_services.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["booking_services.read"],
    )
  },
  loader: async ({ params }) =>
    loadBookingServiceDetailFn({ data: { serviceId: params.serviceId } }),
  component: BookingServiceDetailPage,
})

function BookingServiceDetailPage() {
  const router = useRouter()
  const { serviceId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [quoteFields, setQuoteFields] = useState<BookingServiceFieldDefinition[]>(
    data.quoteFields,
  )
  const [bookingFields, setBookingFields] = useState<
    BookingServiceFieldDefinition[]
  >(data.bookingFields)
  const [sameStartEndDefault, setSameStartEndDefault] = useState(
    data.service.sameStartEndDefault,
  )
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const canWrite = hasPermission(
    permissions,
    PERMISSION_KEYS["booking_services.write"],
  )

  async function handleSave() {
    if (!canWrite) {
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      const result = await updateBookingServiceFieldsFn({
        data: { serviceId, quoteFields, bookingFields },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage("Field definitions saved.")
      await router.invalidate()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveSchedule() {
    if (!canWrite) {
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      const result = await updateBookingServiceScheduleFn({
        data: { serviceId, sameStartEndDefault },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage("Schedule settings saved.")
      await router.invalidate()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/app/booking-services"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to booking services
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {data.service.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.service.code} · {data.service.category}
        </p>
      </div>

      {canWrite ? (
        <>
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="font-medium">Schedule</h3>
            <p className="text-sm text-muted-foreground">
              Every quote and booking line for this service collects start and end
              date/time. Use this when both are typically the same (e.g. visa,
              insurance).
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sameStartEndDefault}
                onChange={(event) => setSameStartEndDefault(event.target.checked)}
              />
              Default end date/time to match start
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => void handleSaveSchedule()}
            >
              Save schedule setting
            </Button>
          </div>

          <ServiceFieldSchemaEditor
            title="Additional quote fields"
            description="Start and end date/time are always collected. Add extra fields here (do not use start_datetime or end_datetime as keys)."
            fields={quoteFields}
            onChange={setQuoteFields}
            idPrefix="quote-fields"
          />
          <ServiceFieldSchemaEditor
            title="Additional booking fields"
            description="Shown on bookings after conversion. Use the same keys as quote extras when values should carry over."
            fields={bookingFields}
            onChange={setBookingFields}
            idPrefix="booking-fields"
          />
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save field definitions"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          You do not have permission to edit field definitions.
        </p>
      )}

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  )
}

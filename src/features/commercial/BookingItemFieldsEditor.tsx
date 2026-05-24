import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { ServiceFieldInputs } from "@/features/commercial/ServiceFieldInputs"
import { ServiceFieldValuesList } from "@/features/commercial/ServiceFieldValuesList"
import type { ServiceSchemaEntry } from "@/shared/commercial/service-schema-map"
import { parseFieldValuesJson } from "@/shared/commercial/service-fields"
import type { ServiceFieldValues } from "@/shared/commercial/service-fields"
import { updateBookingItemFieldsFn } from "@/server/services/bookings/actions"

type BookingItemFieldsEditorProps = {
  bookingId: string
  item: {
    id: string
    bookingServiceId: string
    description: string
    fieldsJson: string
  }
  serviceSchema: ServiceSchemaEntry | undefined
  canWrite: boolean
  onSaved: () => Promise<void>
}

export function BookingItemFieldsEditor({
  bookingId,
  item,
  serviceSchema,
  canWrite,
  onSaved,
}: BookingItemFieldsEditorProps) {
  const bookingFields = serviceSchema?.bookingFields ?? []
  const initialValues = useMemo(
    () => parseFieldValuesJson(item.fieldsJson),
    [item.fieldsJson],
  )
  const [values, setValues] = useState<ServiceFieldValues>(initialValues)
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  if (bookingFields.length === 0) {
    return null
  }

  async function handleSave() {
    if (!canWrite) {
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      const result = await updateBookingItemFieldsFn({
        data: {
          bookingId,
          itemId: item.id,
          fields: values,
        },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage("Fields saved.")
      await onSaved()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Booking fields
      </p>
      {canWrite ? (
        <>
          <ServiceFieldInputs
            fields={bookingFields}
            values={values}
            onChange={setValues}
            idPrefix={`booking-item-${item.id}`}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving..." : "Save fields"}
          </Button>
        </>
      ) : (
        <ServiceFieldValuesList fields={bookingFields} values={initialValues} />
      )}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}


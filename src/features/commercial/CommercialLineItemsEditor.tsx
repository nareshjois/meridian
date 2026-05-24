import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServiceFieldInputs } from "@/features/commercial/ServiceFieldInputs"
import type { CommercialLineItemDraft } from "@/features/commercial/line-item-draft"
import { parseServiceFieldsJson } from "@/shared/commercial/service-fields"
import type { BookingService } from "@/server/db/schema/booking-services"

const selectClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm"

type CommercialLineItemsEditorProps = {
  phase: "quote" | "booking"
  items: CommercialLineItemDraft[]
  bookingServices: BookingService[]
  onChange: (items: CommercialLineItemDraft[]) => void
}

export function CommercialLineItemsEditor({
  phase,
  items,
  bookingServices,
  onChange,
}: CommercialLineItemsEditorProps) {
  function updateItem(id: string, patch: Partial<CommercialLineItemDraft>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function addItem() {
    const defaultServiceId = bookingServices[0]?.id ?? ""
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        bookingServiceId: defaultServiceId,
        description: "",
        quantity: 1,
        unitPrice: "100.00",
        fieldValues: {},
      },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      return
    }
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Services</h2>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          Add service
        </Button>
      </div>

      {items.map((item, index) => (
        <LineItemCard
          key={item.id}
          phase={phase}
          index={index}
          item={item}
          bookingServices={bookingServices}
          canRemove={items.length > 1}
          onUpdate={(patch) => updateItem(item.id, patch)}
          onRemove={() => removeItem(item.id)}
        />
      ))}
    </div>
  )
}

type LineItemCardProps = {
  phase: "quote" | "booking"
  index: number
  item: CommercialLineItemDraft
  bookingServices: BookingService[]
  canRemove: boolean
  onUpdate: (patch: Partial<CommercialLineItemDraft>) => void
  onRemove: () => void
}

function LineItemCard({
  phase,
  index,
  item,
  bookingServices,
  canRemove,
  onUpdate,
  onRemove,
}: LineItemCardProps) {
  const selectedService = bookingServices.find(
    (service) => service.id === item.bookingServiceId,
  )
  const serviceFields = useMemo(() => {
    const schemaJson =
      phase === "quote"
        ? selectedService?.quoteFieldsSchemaJson
        : selectedService?.bookingFieldsSchemaJson
    return parseServiceFieldsJson(schemaJson)
  }, [phase, selectedService])

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Service {index + 1}</p>
        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${item.id}-service`}>Booking service</Label>
          <select
            id={`${item.id}-service`}
            required
            value={item.bookingServiceId}
            onChange={(event) =>
              onUpdate({
                bookingServiceId: event.target.value,
                fieldValues: {},
              })
            }
            className={selectClassName}
          >
            {bookingServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${item.id}-description`}>Description</Label>
          <Input
            id={`${item.id}-description`}
            value={item.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
            placeholder="Line item description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${item.id}-quantity`}>Quantity</Label>
          <Input
            id={`${item.id}-quantity`}
            type="number"
            min={1}
            step={1}
            value={item.quantity}
            onChange={(event) =>
              onUpdate({ quantity: Number.parseInt(event.target.value, 10) || 1 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${item.id}-unit-price`}>Unit price</Label>
          <Input
            id={`${item.id}-unit-price`}
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(event) => onUpdate({ unitPrice: event.target.value })}
          />
        </div>
      </div>

      {serviceFields.length > 0 ? (
        <div className="rounded-md border border-border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {phase === "quote" ? "Quote fields" : "Booking fields"}
          </p>
          <ServiceFieldInputs
            fields={serviceFields}
            values={item.fieldValues}
            onChange={(fieldValues) => onUpdate({ fieldValues })}
            idPrefix={`${item.id}-fields`}
          />
        </div>
      ) : null}
    </div>
  )
}

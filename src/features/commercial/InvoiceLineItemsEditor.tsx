import { Fragment, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { ServiceFieldInputs } from "@/features/commercial/ServiceFieldInputs"
import type { CommercialLineItemDraft } from "@/features/commercial/line-item-draft"
import type { ServiceSchemaEntry } from "@/shared/commercial/service-schema-map"
import {
  END_DATETIME_KEY,
  START_DATETIME_KEY,
  applyStartEndSync,
} from "@/shared/commercial/service-fields"
import type { BookingService } from "@/server/db/schema/booking-services"
import { cn } from "@/lib/utils"
import { formatMoneyCents } from "@/shared/currency"

const cellInputClassName =
  "h-9 w-full min-w-0 rounded-md border border-border bg-background px-2 text-sm"

type InvoiceLineItemsEditorProps = {
  phase: "quote" | "booking"
  items: CommercialLineItemDraft[]
  bookingServices: BookingService[]
  schemaMap: Record<string, ServiceSchemaEntry>
  onChange: (items: CommercialLineItemDraft[]) => void
}

function lineTotalCents(item: CommercialLineItemDraft) {
  const unit = Number.parseFloat(item.unitPrice)
  if (Number.isNaN(unit)) {
    return 0
  }
  return Math.round(item.quantity * unit * 100)
}

export function InvoiceLineItemsEditor({
  phase,
  items,
  bookingServices,
  schemaMap,
  onChange,
}: InvoiceLineItemsEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + lineTotalCents(item), 0),
    [items],
  )

  function updateItem(id: string, patch: Partial<CommercialLineItemDraft>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function updateFieldValues(
    item: CommercialLineItemDraft,
    key: string,
    value: string,
  ) {
    const schema = schemaMap[item.bookingServiceId]
    const sameStartEnd = schema?.sameStartEndDefault ?? false
    const nextValues = applyStartEndSync(
      item.fieldValues,
      sameStartEnd,
      START_DATETIME_KEY,
      END_DATETIME_KEY,
      key,
      value,
    )
    updateItem(item.id, { fieldValues: nextValues })
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

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const customFieldsKey =
    phase === "quote" ? "customQuoteFields" : "customBookingFields"

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-0 text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Service</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="w-16 px-3 py-2 font-medium">Qty</th>
              <th className="w-28 px-3 py-2 font-medium">Rate</th>
              <th className="w-44 px-3 py-2 font-medium">Start</th>
              <th className="w-44 px-3 py-2 font-medium">End</th>
              <th className="w-28 px-3 py-2 text-right font-medium">Amount</th>
              <th className="w-20 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const schema = schemaMap[item.bookingServiceId]
              const customFields = schema?.[customFieldsKey] ?? []
              const hasCustomFields = customFields.length > 0
              const expanded = expandedIds.has(item.id)
              const sameStartEnd = schema?.sameStartEndDefault ?? false

              return (
                <Fragment key={item.id}>
                  <tr className="border-b border-border align-top">
                    <td className="px-3 py-2">
                      <select
                        value={item.bookingServiceId}
                        onChange={(event) =>
                          updateItem(item.id, {
                            bookingServiceId: event.target.value,
                            fieldValues: {},
                          })
                        }
                        className={cellInputClassName}
                      >
                        {bookingServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(item.id, { description: event.target.value })
                        }
                        placeholder="Description"
                        className={cellInputClassName}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.id, {
                            quantity:
                              Number.parseInt(event.target.value, 10) || 1,
                          })
                        }
                        className={cn(cellInputClassName, "text-center")}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(item.id, { unitPrice: event.target.value })
                        }
                        className={cn(cellInputClassName, "text-right")}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="datetime-local"
                        value={item.fieldValues[START_DATETIME_KEY] ?? ""}
                        onChange={(event) =>
                          updateFieldValues(
                            item,
                            START_DATETIME_KEY,
                            event.target.value,
                          )
                        }
                        className={cellInputClassName}
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="datetime-local"
                        value={item.fieldValues[END_DATETIME_KEY] ?? ""}
                        onChange={(event) =>
                          updateFieldValues(
                            item,
                            END_DATETIME_KEY,
                            event.target.value,
                          )
                        }
                        className={cellInputClassName}
                        disabled={sameStartEnd}
                        title={
                          sameStartEnd
                            ? "End matches start for this service"
                            : undefined
                        }
                        required
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatMoneyCents(lineTotalCents(item))}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {hasCustomFields ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            {expanded ? "Less" : "More"}
                          </button>
                        ) : null}
                        {items.length > 1 ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => removeItem(item.id)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {expanded && hasCustomFields ? (
                    <tr key={`${item.id}-extra`} className="border-b border-border bg-muted/20">
                      <td colSpan={8} className="px-3 py-3">
                        <ServiceFieldInputs
                          fields={customFields}
                          values={item.fieldValues}
                          onChange={(fieldValues) =>
                            updateItem(item.id, { fieldValues })
                          }
                          idPrefix={`${item.id}-custom`}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/20">
              <td colSpan={6} className="px-3 py-3 text-right font-medium">
                Subtotal
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">
                {formatMoneyCents(subtotalCents)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        Add line
      </Button>
    </div>
  )
}

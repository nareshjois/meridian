import {
  formatDatetimeDisplay,
  parseFieldValuesJson,
  START_DATETIME_KEY,
  END_DATETIME_KEY,
} from "@/shared/commercial/service-fields"
import type { ServiceSchemaEntry } from "@/shared/commercial/service-schema-map"
import { formatMoneyCents } from "@/shared/currency"

type InvoiceLineItem = {
  id: string
  bookingServiceId: string
  description: string
  quantity: number
  unitPriceCents: number
  fieldsJson: string
}

type InvoiceLineItemsTableProps = {
  phase: "quote" | "booking"
  items: InvoiceLineItem[]
  currency: string
  schemaMap: Record<string, ServiceSchemaEntry>
}

export function InvoiceLineItemsTable({
  phase,
  items,
  currency,
  schemaMap,
}: InvoiceLineItemsTableProps) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  )

  const customFieldsKey =
    phase === "quote" ? "customQuoteFields" : "customBookingFields"

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Start</th>
            <th className="px-4 py-3 font-medium">End</th>
            <th className="px-4 py-3 text-right font-medium">Qty</th>
            <th className="px-4 py-3 text-right font-medium">Rate</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const schema = schemaMap[item.bookingServiceId]
            const values = parseFieldValuesJson(item.fieldsJson)
            const customFields = schema?.[customFieldsKey] ?? []

            return (
              <tr key={item.id} className="border-b border-border align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{schema?.name ?? "Service"}</p>
                  {schema ? (
                    <p className="text-xs text-muted-foreground">{schema.code}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <p>{item.description}</p>
                  {customFields.length > 0 ? (
                    <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {customFields.map((field) => (
                        <div key={field.key} className="flex gap-2">
                          <dt>{field.label}:</dt>
                          <dd>{values[field.key]?.trim() || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDatetimeDisplay(values[START_DATETIME_KEY])}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDatetimeDisplay(values[END_DATETIME_KEY])}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoneyCents(item.unitPriceCents, currency)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatMoneyCents(item.quantity * item.unitPriceCents, currency)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/20">
            <td colSpan={6} className="px-4 py-3 text-right font-medium">
              Total
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums">
              {formatMoneyCents(subtotalCents, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

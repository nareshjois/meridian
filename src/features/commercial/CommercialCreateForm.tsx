import { useMemo, useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CommercialDocumentsEditor } from "@/features/commercial/CommercialDocumentsEditor"
import { InvoiceLineItemsEditor } from "@/features/commercial/InvoiceLineItemsEditor"
import { CommercialVendorQuotesEditor } from "@/features/commercial/CommercialVendorQuotesEditor"
import {
  createEmptyLineItem,
  type CommercialLineItemDraft,
} from "@/features/commercial/line-item-draft"
import { buildServiceSchemaMap } from "@/shared/commercial/service-schema-map"
import type { BookingService } from "@/server/db/schema/booking-services"
import type { Customer } from "@/server/db/schema/crm"
import type { Vendor } from "@/server/db/schema/vendors"
import type {
  CommercialDocumentInput,
  VendorQuoteAttachmentInput,
} from "@/shared/validation/dtos/commercial"

export type CommercialCreatePayload = {
  customerId: string
  items: Array<{
    bookingServiceId: string
    description: string
    quantity: number
    unitPriceCents: number
    fields: Record<string, string>
  }>
  documents: CommercialDocumentInput[]
  vendorQuotes: VendorQuoteAttachmentInput[]
}

type CommercialCreateFormProps = {
  phase: "quote" | "booking"
  customers: Customer[]
  bookingServices: BookingService[]
  vendors: Vendor[]
  isSubmitting: boolean
  message: string
  onSubmit: (payload: CommercialCreatePayload) => Promise<void>
}

const selectClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm"

export function CommercialCreateForm({
  phase,
  customers,
  bookingServices,
  vendors,
  isSubmitting,
  message,
  onSubmit,
}: CommercialCreateFormProps) {
  const defaultServiceId = bookingServices[0]?.id ?? ""
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "")
  const [lineItems, setLineItems] = useState<CommercialLineItemDraft[]>([
    createEmptyLineItem(defaultServiceId),
  ])
  const [documents, setDocuments] = useState<CommercialDocumentInput[]>([])
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuoteAttachmentInput[]>(
    [],
  )

  const schemaMap = useMemo(
    () => buildServiceSchemaMap(bookingServices),
    [bookingServices],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!customerId || lineItems.length === 0) {
      return
    }

    const items = lineItems.map((item) => {
      const unitPriceCents = Math.round(Number.parseFloat(item.unitPrice) * 100)
      return {
        bookingServiceId: item.bookingServiceId,
        description: item.description.trim() || "Line item",
        quantity: item.quantity,
        unitPriceCents: Number.isNaN(unitPriceCents) ? 0 : unitPriceCents,
        fields: item.fieldValues,
      }
    })

    const filledDocuments = documents.filter(
      (doc) => doc.label.trim() && doc.fileName.trim(),
    )
    const filledVendorQuotes = vendorQuotes.filter(
      (quote) => quote.label.trim() && quote.vendorId,
    )

    await onSubmit({
      customerId,
      items,
      documents: filledDocuments,
      vendorQuotes: filledVendorQuotes,
    })
  }

  if (customers.length === 0) {
    return (
      <p className="text-sm text-amber-700">
        Add a customer in CRM before creating {phase === "quote" ? "quotes" : "bookings"}.
      </p>
    )
  }

  if (bookingServices.length === 0) {
    return (
      <p className="text-sm text-amber-700">
        Add an active booking service before creating{" "}
        {phase === "quote" ? "quotes" : "bookings"}.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2 max-w-md">
        <Label htmlFor={`${phase}-customer`}>Customer</Label>
        <select
          id={`${phase}-customer`}
          required
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          className={selectClassName}
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.displayName}
            </option>
          ))}
        </select>
      </div>

      <InvoiceLineItemsEditor
        phase={phase}
        items={lineItems}
        bookingServices={bookingServices}
        schemaMap={schemaMap}
        onChange={setLineItems}
      />

      <CommercialDocumentsEditor documents={documents} onChange={setDocuments} />

      <CommercialVendorQuotesEditor
        vendorQuotes={vendorQuotes}
        vendors={vendors}
        onChange={setVendorQuotes}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Creating..."
          : phase === "quote"
            ? "Create quote"
            : "Create booking"}
      </Button>

      {message ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  )
}

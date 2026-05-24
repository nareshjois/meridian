import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { VendorQuoteAttachmentInput } from "@/shared/validation/dtos/commercial"
import type { Vendor } from "@/server/db/schema/vendors"

const selectClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm"

type CommercialVendorQuotesEditorProps = {
  vendorQuotes: VendorQuoteAttachmentInput[]
  vendors: Vendor[]
  onChange: (vendorQuotes: VendorQuoteAttachmentInput[]) => void
}

function emptyVendorQuote(defaultVendorId: string): VendorQuoteAttachmentInput {
  return {
    vendorId: defaultVendorId,
    label: "",
    vendorReference: "",
    amountCents: undefined,
    fileName: "",
    notes: "",
  }
}

export function CommercialVendorQuotesEditor({
  vendorQuotes,
  vendors,
  onChange,
}: CommercialVendorQuotesEditorProps) {
  const defaultVendorId = vendors[0]?.id ?? ""

  function updateQuote(
    index: number,
    patch: Partial<VendorQuoteAttachmentInput>,
  ) {
    onChange(
      vendorQuotes.map((quote, quoteIndex) =>
        quoteIndex === index ? { ...quote, ...patch } : quote,
      ),
    )
  }

  if (vendors.length === 0) {
    return (
      <p className="text-sm text-amber-700">
        Add an active vendor before attaching vendor quotes.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Vendor quotes</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...vendorQuotes, emptyVendorQuote(defaultVendorId)])
          }
        >
          Add vendor quote
        </Button>
      </div>

      {vendorQuotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No vendor quotes attached yet.
        </p>
      ) : null}

      {vendorQuotes.map((quote, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`vq-vendor-${index}`}>Vendor</Label>
            <select
              id={`vq-vendor-${index}`}
              value={quote.vendorId}
              onChange={(event) =>
                updateQuote(index, { vendorId: event.target.value })
              }
              className={selectClassName}
            >
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`vq-label-${index}`}>Label</Label>
            <Input
              id={`vq-label-${index}`}
              value={quote.label}
              onChange={(event) =>
                updateQuote(index, { label: event.target.value })
              }
              placeholder="e.g. Flight quote from ABC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`vq-ref-${index}`}>Vendor reference</Label>
            <Input
              id={`vq-ref-${index}`}
              value={quote.vendorReference ?? ""}
              onChange={(event) =>
                updateQuote(index, { vendorReference: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`vq-amount-${index}`}>Amount</Label>
            <Input
              id={`vq-amount-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={
                quote.amountCents != null
                  ? (quote.amountCents / 100).toFixed(2)
                  : ""
              }
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                updateQuote(index, {
                  amountCents: Number.isNaN(parsed)
                    ? undefined
                    : Math.round(parsed * 100),
                })
              }}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`vq-file-${index}`}>File name (optional)</Label>
            <Input
              id={`vq-file-${index}`}
              value={quote.fileName ?? ""}
              onChange={(event) =>
                updateQuote(index, { fileName: event.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange(
                  vendorQuotes.filter((_, quoteIndex) => quoteIndex !== index),
                )
              }
            >
              Remove vendor quote
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

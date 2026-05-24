import type { CommercialAttachmentRow } from "@/server/services/commercial-attachments/repository"
import { formatMoneyCentsOrNull } from "@/shared/currency"

type CommercialAttachmentsPanelProps = {
  documents: CommercialAttachmentRow[]
  vendorQuotes: CommercialAttachmentRow[]
}

export function CommercialAttachmentsPanel({
  documents,
  vendorQuotes,
}: CommercialAttachmentsPanelProps) {
  if (documents.length === 0 && vendorQuotes.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {documents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-medium">Documents</h2>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium">{doc.label}</p>
                <p className="text-muted-foreground">{doc.fileName}</p>
                {doc.notes ? (
                  <p className="mt-1 text-muted-foreground">{doc.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {vendorQuotes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-medium">Vendor quotes</h2>
          <ul className="space-y-2">
            {vendorQuotes.map((quote) => (
              <li
                key={quote.id}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium">{quote.label}</p>
                <p className="text-muted-foreground">
                  {quote.vendorName ?? "Vendor"} ·{" "}
                  {quote.vendorReference ?? "No reference"}
                </p>
                <p className="text-muted-foreground">
                  {formatMoneyCentsOrNull(quote.amountCents, quote.currency) ?? "—"}
                  {quote.fileName ? ` · ${quote.fileName}` : ""}
                </p>
                {quote.notes ? (
                  <p className="mt-1 text-muted-foreground">{quote.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

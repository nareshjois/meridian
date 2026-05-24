import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CommercialDocumentInput } from "@/shared/validation/dtos/commercial"

type CommercialDocumentsEditorProps = {
  documents: CommercialDocumentInput[]
  onChange: (documents: CommercialDocumentInput[]) => void
}

function emptyDocument(): CommercialDocumentInput {
  return { label: "", fileName: "", notes: "" }
}

export function CommercialDocumentsEditor({
  documents,
  onChange,
}: CommercialDocumentsEditorProps) {
  function updateDocument(
    index: number,
    patch: Partial<CommercialDocumentInput>,
  ) {
    onChange(
      documents.map((doc, docIndex) =>
        docIndex === index ? { ...doc, ...patch } : doc,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Documents</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...documents, emptyDocument()])}
        >
          Add document
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No documents attached yet.
        </p>
      ) : null}

      {documents.map((doc, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`doc-label-${index}`}>Label</Label>
            <Input
              id={`doc-label-${index}`}
              value={doc.label}
              onChange={(event) =>
                updateDocument(index, { label: event.target.value })
              }
              placeholder="e.g. Passport copy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`doc-file-${index}`}>File name</Label>
            <Input
              id={`doc-file-${index}`}
              value={doc.fileName}
              onChange={(event) =>
                updateDocument(index, { fileName: event.target.value })
              }
              placeholder="document.pdf"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`doc-notes-${index}`}>Notes (optional)</Label>
            <Input
              id={`doc-notes-${index}`}
              value={doc.notes ?? ""}
              onChange={(event) =>
                updateDocument(index, { notes: event.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange(documents.filter((_, docIndex) => docIndex !== index))
              }
            >
              Remove document
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

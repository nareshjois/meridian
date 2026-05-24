import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookingServiceFieldDefinition } from "@/shared/commercial/service-fields"

const fieldClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm"

type ServiceFieldSchemaEditorProps = {
  title: string
  description: string
  fields: BookingServiceFieldDefinition[]
  onChange: (fields: BookingServiceFieldDefinition[]) => void
  idPrefix: string
}

export function ServiceFieldSchemaEditor({
  title,
  description,
  fields,
  onChange,
  idPrefix,
}: ServiceFieldSchemaEditorProps) {
  const [draftKey, setDraftKey] = useState("")
  const [draftLabel, setDraftLabel] = useState("")
  const [draftType, setDraftType] =
    useState<BookingServiceFieldDefinition["type"]>("text")
  const [draftRequired, setDraftRequired] = useState(false)

  function addField() {
    const key = draftKey.trim().toLowerCase()
    const label = draftLabel.trim()
    if (!key || !label) {
      return
    }
    if (fields.some((field) => field.key === key)) {
      return
    }

    onChange([
      ...fields,
      { key, label, type: draftType, required: draftRequired },
    ])
    setDraftKey("")
    setDraftLabel("")
    setDraftRequired(false)
  }

  function removeField(key: string) {
    onChange(fields.filter((field) => field.key !== key))
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {fields.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {fields.map((field) => (
            <li
              key={field.key}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span>
                <span className="font-medium">{field.label}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {field.key}
                </span>
                <span className="ml-2 capitalize text-muted-foreground">
                  ({field.type}
                  {field.required ? ", required" : ""})
                </span>
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeField(field.key)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No fields defined yet.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-key`}>Field key</Label>
          <Input
            id={`${idPrefix}-key`}
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            className={fieldClassName}
            placeholder="departure_date"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-label`}>Label</Label>
          <Input
            id={`${idPrefix}-label`}
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            className={fieldClassName}
            placeholder="Departure date"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-type`}>Type</Label>
          <select
            id={`${idPrefix}-type`}
            value={draftType}
            onChange={(event) =>
              setDraftType(event.target.value as BookingServiceFieldDefinition["type"])
            }
            className={fieldClassName}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="datetime">Date & time</option>
            <option value="textarea">Text area</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={draftRequired}
            onChange={(event) => setDraftRequired(event.target.checked)}
          />
          Required
        </label>
      </div>

      <Button type="button" variant="outline" onClick={addField}>
        Add field
      </Button>
    </div>
  )
}

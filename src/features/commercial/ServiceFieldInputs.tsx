import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  BookingServiceFieldDefinition,
  ServiceFieldValues,
} from "@/shared/commercial/service-fields"

const fieldClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm"

type ServiceFieldInputsProps = {
  fields: BookingServiceFieldDefinition[]
  values: ServiceFieldValues
  onChange: (values: ServiceFieldValues) => void
  idPrefix: string
}

export function ServiceFieldInputs({
  fields,
  values,
  onChange,
  idPrefix,
}: ServiceFieldInputsProps) {
  if (fields.length === 0) {
    return null
  }

  function updateField(key: string, value: string) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.key}
          className={field.type === "textarea" ? "space-y-1 sm:col-span-2" : "space-y-1"}
        >
          <Label htmlFor={`${idPrefix}-${field.key}`}>
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          {field.type === "textarea" ? (
            <textarea
              id={`${idPrefix}-${field.key}`}
              value={values[field.key] ?? ""}
              onChange={(event) => updateField(field.key, event.target.value)}
              className={`${fieldClassName} min-h-20 py-2`}
              required={field.required}
            />
          ) : (
            <Input
              id={`${idPrefix}-${field.key}`}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={values[field.key] ?? ""}
              onChange={(event) => updateField(field.key, event.target.value)}
              className={fieldClassName}
              required={field.required}
            />
          )}
        </div>
      ))}
    </div>
  )
}


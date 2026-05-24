import type {
  BookingServiceFieldDefinition,
  ServiceFieldValues,
} from "@/shared/commercial/service-fields"

type ServiceFieldValuesListProps = {
  fields: BookingServiceFieldDefinition[]
  values: ServiceFieldValues
}

export function ServiceFieldValuesList({
  fields,
  values,
}: ServiceFieldValuesListProps) {
  if (fields.length === 0) {
    return null
  }

  return (
    <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key}>
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd>{values[field.key]?.trim() ? values[field.key] : "—"}</dd>
        </div>
      ))}
    </dl>
  )
}


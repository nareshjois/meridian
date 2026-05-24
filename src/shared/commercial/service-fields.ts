import { z } from "zod"

import { nonEmptyStringSchema } from "../validation/common"

export const bookingServiceFieldDefinitionSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Field key must start with a letter and use lowercase letters, numbers, or underscores",
    ),
  label: nonEmptyStringSchema,
  type: z.enum(["text", "number", "date", "textarea"]),
  required: z.boolean().optional().default(false),
})
export type BookingServiceFieldDefinition = z.infer<
  typeof bookingServiceFieldDefinitionSchema
>

export const bookingServiceFieldsSchema = z.array(
  bookingServiceFieldDefinitionSchema,
)

export type ServiceFieldValues = Record<string, string>

export function parseServiceFieldsJson(json: string | null | undefined) {
  if (!json?.trim()) {
    return [] as BookingServiceFieldDefinition[]
  }

  try {
    const parsed = JSON.parse(json) as unknown
    return bookingServiceFieldsSchema.parse(parsed)
  } catch {
    return [] as BookingServiceFieldDefinition[]
  }
}

export function serializeServiceFields(fields: BookingServiceFieldDefinition[]) {
  return JSON.stringify(bookingServiceFieldsSchema.parse(fields))
}

export function parseFieldValuesJson(json: string | null | undefined) {
  if (!json?.trim()) {
    return {} as ServiceFieldValues
  }

  try {
    const parsed = JSON.parse(json) as unknown
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    const values: ServiceFieldValues = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        values[key] = value
      } else if (value != null) {
        values[key] = String(value)
      }
    }
    return values
  } catch {
    return {}
  }
}

export function serializeFieldValues(values: ServiceFieldValues) {
  return JSON.stringify(values)
}

export function validateFieldValues(
  schema: BookingServiceFieldDefinition[],
  values: ServiceFieldValues,
  phase: "quote" | "booking",
): string | null {
  for (const field of schema) {
    const value = values[field.key]?.trim() ?? ""
    if (field.required && !value) {
      return `${field.label} is required for ${phase} line items.`
    }

    if (!value) {
      continue
    }

    if (field.type === "number" && Number.isNaN(Number(value))) {
      return `${field.label} must be a number.`
    }

    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${field.label} must be a date (YYYY-MM-DD).`
    }
  }

  return null
}

export function mergeFieldValuesForBookingConversion(
  quoteValues: ServiceFieldValues,
  quoteFields: BookingServiceFieldDefinition[],
  bookingFields: BookingServiceFieldDefinition[],
): ServiceFieldValues {
  const merged: ServiceFieldValues = { ...quoteValues }

  for (const field of bookingFields) {
    if (!(field.key in merged)) {
      merged[field.key] = ""
    }
  }

  for (const key of Object.keys(merged)) {
    const inQuote = quoteFields.some((field) => field.key === key)
    const inBooking = bookingFields.some((field) => field.key === key)
    if (!inQuote && !inBooking) {
      delete merged[key]
    }
  }

  return merged
}

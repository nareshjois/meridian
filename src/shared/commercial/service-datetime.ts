import type { BookingServiceFieldDefinition } from "./service-fields"

/** Reserved keys for built-in schedule fields on every line item. */
export const START_DATETIME_KEY = "start_datetime"
export const END_DATETIME_KEY = "end_datetime"

export const RESERVED_FIELD_KEYS = new Set([
  START_DATETIME_KEY,
  END_DATETIME_KEY,
])

export const BUILT_IN_DATETIME_FIELDS: readonly BookingServiceFieldDefinition[] =
  [
    {
      key: START_DATETIME_KEY,
      label: "Start",
      type: "datetime",
      required: true,
    },
    {
      key: END_DATETIME_KEY,
      label: "End",
      type: "datetime",
      required: true,
    },
  ] as const

export function isReservedFieldKey(key: string) {
  return RESERVED_FIELD_KEYS.has(key)
}

export function getCustomFieldsOnly(
  fields: BookingServiceFieldDefinition[],
): BookingServiceFieldDefinition[] {
  return fields.filter((field) => !isReservedFieldKey(field.key))
}

export function getEffectiveServiceFields(
  customFields: BookingServiceFieldDefinition[],
): BookingServiceFieldDefinition[] {
  const custom = getCustomFieldsOnly(customFields)
  return [...BUILT_IN_DATETIME_FIELDS, ...custom]
}

/** `datetime-local` value or ISO string for display. */
export function formatDatetimeDisplay(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return "—"
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return trimmed
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/** Normalize to value suitable for `<input type="datetime-local" />`. */
export function toDatetimeLocalValue(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ""
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function applyStartEndSync(
  values: Record<string, string>,
  sameStartEndDefault: boolean,
  startKey: string,
  endKey: string,
  changedKey: string,
  nextValue: string,
) {
  const next = { ...values, [changedKey]: nextValue }

  if (
    sameStartEndDefault &&
    changedKey === startKey &&
    (next[endKey]?.trim() === "" || next[endKey] === values[startKey])
  ) {
    next[endKey] = nextValue
  }

  return next
}

import type { CustomerCreateInput, CustomerUpdateInput } from "@/shared/validation/dtos/crm"
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_PHONE_COUNTRY_CODE,
} from "@/shared/geo/countries"

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function buildCustomerInsertValues(
  agencyId: string,
  input: CustomerCreateInput,
  id: string,
  now: Date,
) {
  return {
    id,
    agencyId,
    displayName: input.displayName.trim(),
    email: input.email?.trim().toLowerCase() ?? null,
    phoneCountryCode: input.phoneCountryCode ?? DEFAULT_PHONE_COUNTRY_CODE,
    phone: normalizeOptionalString(input.phone),
    address: normalizeOptionalString(input.address),
    city: normalizeOptionalString(input.city),
    state: normalizeOptionalString(input.state),
    countryCode: input.countryCode ?? DEFAULT_COUNTRY_CODE,
    dateOfBirth: normalizeOptionalString(input.dateOfBirth),
    passportNumber: normalizeOptionalString(input.passportNumber),
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildCustomerUpdateValues(
  existing: {
    displayName: string
    email: string | null
    phoneCountryCode: string
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    countryCode: string
    dateOfBirth: string | null
    passportNumber: string | null
    status: "active" | "inactive"
  },
  input: CustomerUpdateInput,
) {
  return {
    displayName: input.displayName?.trim() ?? existing.displayName,
    email:
      input.email !== undefined
        ? (input.email?.trim().toLowerCase() ?? null)
        : existing.email,
    phoneCountryCode: input.phoneCountryCode ?? existing.phoneCountryCode,
    phone:
      input.phone !== undefined
        ? normalizeOptionalString(input.phone)
        : existing.phone,
    address:
      input.address !== undefined
        ? normalizeOptionalString(input.address)
        : existing.address,
    city:
      input.city !== undefined ? normalizeOptionalString(input.city) : existing.city,
    state:
      input.state !== undefined
        ? normalizeOptionalString(input.state)
        : existing.state,
    countryCode: input.countryCode ?? existing.countryCode,
    dateOfBirth:
      input.dateOfBirth !== undefined
        ? normalizeOptionalString(input.dateOfBirth)
        : existing.dateOfBirth,
    passportNumber:
      input.passportNumber !== undefined
        ? normalizeOptionalString(input.passportNumber)
        : existing.passportNumber,
    status: input.status ?? existing.status,
    updatedAt: new Date(),
  }
}

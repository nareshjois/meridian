import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_PHONE_COUNTRY_CODE,
  findCountryByCode,
  findCountryByDialCode,
} from "@/shared/geo/countries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type CustomerFormValues = {
  displayName: string
  email: string
  phoneCountryCode: string
  phone: string
  address: string
  city: string
  state: string
  countryCode: string
  dateOfBirth: string
  passportNumber: string
  status?: "active" | "inactive"
}

export const emptyCustomerFormValues: CustomerFormValues = {
  displayName: "",
  email: "",
  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  phone: "",
  address: "",
  city: "",
  state: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  dateOfBirth: "",
  passportNumber: "",
}

export function customerToFormValues(customer: {
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
}): CustomerFormValues {
  return {
    displayName: customer.displayName,
    email: customer.email ?? "",
    phoneCountryCode: customer.phoneCountryCode,
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    countryCode: customer.countryCode,
    dateOfBirth: customer.dateOfBirth ?? "",
    passportNumber: customer.passportNumber ?? "",
    status: customer.status,
  }
}

type CustomerFormFieldsProps = {
  values: CustomerFormValues
  onChange: (values: CustomerFormValues) => void
  showStatus?: boolean
  idPrefix?: string
}

const fieldClassName =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm"

export function CustomerFormFields({
  values,
  onChange,
  showStatus = false,
  idPrefix = "customer",
}: CustomerFormFieldsProps) {
  function updateField<K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K],
  ) {
    onChange({ ...values, [field]: value })
  }

  function handleCountryChange(countryCode: string) {
    const country = findCountryByCode(countryCode)
    onChange({
      ...values,
      countryCode,
      phoneCountryCode: country?.dialCode ?? values.phoneCountryCode,
    })
  }

  function handlePhoneCountryCodeChange(phoneCountryCode: string) {
    const country = findCountryByDialCode(phoneCountryCode)
    onChange({
      ...values,
      phoneCountryCode,
      countryCode: country?.code ?? values.countryCode,
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-displayName`}>Display name</Label>
        <Input
          id={`${idPrefix}-displayName`}
          required
          value={values.displayName}
          onChange={(event) => updateField("displayName", event.target.value)}
          className={fieldClassName}
          placeholder="Full name as shown in CRM"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          className={fieldClassName}
          placeholder="name@example.com"
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-phone`}>Phone number</Label>
        <div className="flex w-full gap-2">
          <select
            id={`${idPrefix}-phoneCountryCode`}
            value={values.phoneCountryCode}
            onChange={(event) => handlePhoneCountryCodeChange(event.target.value)}
            className={cn(fieldClassName, "w-[5.5rem] shrink-0 px-2")}
            aria-label="Phone country code"
          >
            {COUNTRIES.map((country) => (
              <option
                key={country.code}
                value={country.dialCode}
                title={country.name}
              >
                {country.dialCode}
              </option>
            ))}
          </select>
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className={cn(fieldClassName, "min-w-0 flex-1")}
            placeholder="9876543210"
          />
        </div>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Input
          id={`${idPrefix}-address`}
          value={values.address}
          onChange={(event) => updateField("address", event.target.value)}
          className={fieldClassName}
          placeholder="Street address, apartment, suite"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-city`}>City</Label>
        <Input
          id={`${idPrefix}-city`}
          value={values.city}
          onChange={(event) => updateField("city", event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-state`}>State</Label>
        <Input
          id={`${idPrefix}-state`}
          value={values.state}
          onChange={(event) => updateField("state", event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-countryCode`}>Country</Label>
        <select
          id={`${idPrefix}-countryCode`}
          value={values.countryCode}
          onChange={(event) => handleCountryChange(event.target.value)}
          className={fieldClassName}
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-dateOfBirth`}>Date of birth</Label>
        <Input
          id={`${idPrefix}-dateOfBirth`}
          type="date"
          value={values.dateOfBirth}
          onChange={(event) => updateField("dateOfBirth", event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-passportNumber`}>Passport number</Label>
        <Input
          id={`${idPrefix}-passportNumber`}
          value={values.passportNumber}
          onChange={(event) => updateField("passportNumber", event.target.value)}
          className={fieldClassName}
          placeholder="Passport number"
        />
      </div>

      {showStatus ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-status`}>Status</Label>
          <select
            id={`${idPrefix}-status`}
            value={values.status ?? "active"}
            onChange={(event) =>
              updateField("status", event.target.value as "active" | "inactive")
            }
            className={fieldClassName}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      ) : null}
    </div>
  )
}

function toCustomerPayload(values: CustomerFormValues) {
  return {
    displayName: values.displayName,
    email: values.email || undefined,
    phoneCountryCode: values.phoneCountryCode,
    phone: values.phone || undefined,
    address: values.address || undefined,
    city: values.city || undefined,
    state: values.state || undefined,
    countryCode: values.countryCode,
    dateOfBirth: values.dateOfBirth || undefined,
    passportNumber: values.passportNumber || undefined,
    ...(values.status ? { status: values.status } : {}),
  }
}

export { toCustomerPayload }

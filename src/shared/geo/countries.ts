export type CountryOption = {
  code: string
  name: string
  dialCode: string
}

/** ISO 3166-1 alpha-2 countries with E.164 dial codes (India first). */
export const COUNTRIES: CountryOption[] = [
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "IT", name: "Italy", dialCode: "+39" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "NL", name: "Netherlands", dialCode: "+31" },
  { code: "CH", name: "Switzerland", dialCode: "+41" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "HK", name: "Hong Kong", dialCode: "+852" },
  { code: "TH", name: "Thailand", dialCode: "+66" },
  { code: "MY", name: "Malaysia", dialCode: "+60" },
  { code: "ID", name: "Indonesia", dialCode: "+62" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "QA", name: "Qatar", dialCode: "+974" },
  { code: "OM", name: "Oman", dialCode: "+968" },
  { code: "KW", name: "Kuwait", dialCode: "+965" },
  { code: "BH", name: "Bahrain", dialCode: "+973" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94" },
  { code: "NP", name: "Nepal", dialCode: "+977" },
  { code: "BD", name: "Bangladesh", dialCode: "+880" },
  { code: "PK", name: "Pakistan", dialCode: "+92" },
]

export const DEFAULT_COUNTRY_CODE = "IN"
export const DEFAULT_PHONE_COUNTRY_CODE = "+91"

export function findCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((country) => country.code === code)
}

export function findCountryByDialCode(dialCode: string): CountryOption | undefined {
  return COUNTRIES.find((country) => country.dialCode === dialCode)
}

export function formatCustomerPhone(
  phoneCountryCode: string | null | undefined,
  phone: string | null | undefined,
): string | null {
  if (!phone?.trim()) {
    return null
  }

  if (phoneCountryCode?.trim()) {
    return `${phoneCountryCode.trim()} ${phone.trim()}`
  }

  return phone.trim()
}

export function formatCustomerLocation(
  city: string | null | undefined,
  state: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  const parts: string[] = []

  if (city?.trim()) {
    parts.push(city.trim())
  }
  if (state?.trim()) {
    parts.push(state.trim())
  }
  if (countryCode?.trim()) {
    parts.push(findCountryByCode(countryCode)?.name ?? countryCode.trim())
  }

  return parts.length > 0 ? parts.join(", ") : null
}

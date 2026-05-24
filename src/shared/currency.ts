export const DEFAULT_CURRENCY = "INR"
export const DEFAULT_CURRENCY_LOCALE = "en-IN"

const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string) {
  let formatter = formatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat(DEFAULT_CURRENCY_LOCALE, {
      style: "currency",
      currency,
    })
    formatters.set(currency, formatter)
  }
  return formatter
}

export function formatMoneyCents(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
) {
  return getFormatter(currency).format(cents / 100)
}

export function formatMoneyCentsOrNull(
  cents: number | null | undefined,
  currency?: string | null,
) {
  if (cents == null) {
    return null
  }
  return formatMoneyCents(cents, currency ?? DEFAULT_CURRENCY)
}

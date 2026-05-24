import type { BookingService } from "@/server/db/schema/booking-services"
import {
  getCustomFieldsOnly,
  getEffectiveServiceFields,
  parseServiceFieldsJson,
  type BookingServiceFieldDefinition,
} from "@/shared/commercial/service-fields"

export type ServiceSchemaEntry = {
  name: string
  code: string
  sameStartEndDefault: boolean
  quoteFields: BookingServiceFieldDefinition[]
  bookingFields: BookingServiceFieldDefinition[]
  customQuoteFields: BookingServiceFieldDefinition[]
  customBookingFields: BookingServiceFieldDefinition[]
}

export function buildServiceSchemaMap(
  services: BookingService[],
): Record<string, ServiceSchemaEntry> {
  return Object.fromEntries(
    services.map((service) => {
      const customQuoteFields = getCustomFieldsOnly(
        parseServiceFieldsJson(service.quoteFieldsSchemaJson),
      )
      const customBookingFields = getCustomFieldsOnly(
        parseServiceFieldsJson(service.bookingFieldsSchemaJson),
      )

      return [
        service.id,
        {
          name: service.name,
          code: service.code,
          sameStartEndDefault: service.sameStartEndDefault,
          quoteFields: getEffectiveServiceFields(customQuoteFields),
          bookingFields: getEffectiveServiceFields(customBookingFields),
          customQuoteFields,
          customBookingFields,
        },
      ]
    }),
  )
}

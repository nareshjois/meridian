import type { BookingService } from "@/server/db/schema/booking-services"
import {
  parseServiceFieldsJson,
  type BookingServiceFieldDefinition,
} from "@/shared/commercial/service-fields"

export type ServiceSchemaEntry = {
  name: string
  code: string
  quoteFields: BookingServiceFieldDefinition[]
  bookingFields: BookingServiceFieldDefinition[]
}

export function buildServiceSchemaMap(
  services: BookingService[],
): Record<string, ServiceSchemaEntry> {
  return Object.fromEntries(
    services.map((service) => [
      service.id,
      {
        name: service.name,
        code: service.code,
        quoteFields: parseServiceFieldsJson(service.quoteFieldsSchemaJson),
        bookingFields: parseServiceFieldsJson(service.bookingFieldsSchemaJson),
      },
    ]),
  )
}

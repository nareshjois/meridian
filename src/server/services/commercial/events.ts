import {
  commercialEventSchema,
  type CommercialEvent,
} from "@/shared/validation/dtos/commercial-events"

/** Validates event payloads published for Gate 2 accounting integration. */
export function publishCommercialEvent(event: CommercialEvent): CommercialEvent {
  return commercialEventSchema.parse(event)
}

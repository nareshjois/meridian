import type { MeridianDb } from "@/server/db/client"
import type { MeridianServices } from "@/server/services"
import type { ServiceContext } from "@/server/services/_types"
import type { BookingConfirmedEvent } from "@/shared/validation/dtos/commercial-events"

import { createBookingServiceCatalog } from "../booking-services/catalog.service"
import { createBookingService } from "../bookings/booking.service"
import { createQuoteService } from "../quotes/quote.service"

export type CommercialAccountingPublisher = {
  onBookingConfirmed?: (
    ctx: ServiceContext,
    event: BookingConfirmedEvent,
  ) => Promise<void>
}

export function createCommercialServices(
  db: MeridianDb,
  publisher: CommercialAccountingPublisher = {},
): Pick<MeridianServices, "bookingServices" | "quotes" | "bookings"> {
  return {
    bookingServices: createBookingServiceCatalog(db),
    quotes: createQuoteService(db),
    bookings: createBookingService(db, publisher),
  }
}

export { ensureCommercialSeed, DEFAULT_BOOKING_SERVICES } from "./seed"

import type { MeridianDb } from "@/server/db/client"
import type { BookingServiceCreateInput } from "@/shared/validation/dtos/commercial"

import { createBookingServiceRepository } from "../booking-services/repository"

export const DEFAULT_BOOKING_SERVICES: readonly BookingServiceCreateInput[] =
  [
    { code: "FLIGHT", name: "Flight", category: "transport" },
    { code: "TRAIN", name: "Train", category: "transport" },
    { code: "VISA", name: "Visa", category: "documentation" },
    { code: "HOTEL", name: "Hotel", category: "accommodation" },
    { code: "INSURANCE", name: "Insurance", category: "protection" },
  ] as const

export async function ensureCommercialSeed(db: MeridianDb, agencyId: string) {
  const repo = createBookingServiceRepository(db)
  await repo.seedDefaultServices(agencyId, DEFAULT_BOOKING_SERVICES)
}

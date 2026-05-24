import type { MeridianDb } from "@/server/db/client"
import type { MeridianServices } from "@/server/services"

import { createVendorService } from "./vendor.service"
import type { VendorService } from "./vendor.service"
import type { PayablesAccountingPublisher } from "./payables-events"

export * from "./payables-events"

export function createVendorServices(
  db: MeridianDb,
  publisher: PayablesAccountingPublisher = {},
): Pick<MeridianServices, "vendors"> & {
  vendors: VendorService
} {
  return {
    vendors: createVendorService(db, publisher),
  }
}

export type { VendorService }

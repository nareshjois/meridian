import type { MeridianDb } from "@/server/db/client"
import type { MeridianServices } from "@/server/services"

import { createAccountingService } from "./accounting.service"
import type { AccountingService } from "./accounting.service"

export * from "./seed"
export * from "./fixtures"
export { createAccountingService }
export type { AccountingService }

export function createAccountingServices(db: MeridianDb): Pick<
  MeridianServices,
  "accounting"
> & {
  accounting: AccountingService
} {
  return {
    accounting: createAccountingService(db),
  }
}

import type { MeridianDb } from "@/server/db/client"
import type { MeridianServices } from "@/server/services"

import { createAccountingService } from "./accounting/accounting.service"
import { createCommercialServices } from "./commercial"
import { createCrmServices } from "./crm"
import { createVendorServices } from "./vendors"
import { createAuthService } from "./users/auth.service"
import { createUserService } from "./users/user.service"
import type { UserService } from "./users/user.service"
import type { AccountingService } from "./accounting/accounting.service"
import type { VendorService } from "./vendors/vendor.service"
import type { CustomerFamilyService } from "./customer-families/customer-family.service"
import type { GroupService } from "./groups/group.service"

/** Wired domain services for route loaders and actions. */
export function createMeridianServices(db: MeridianDb): Pick<
  MeridianServices,
  | "auth"
  | "users"
  | "customers"
  | "customerFamilies"
  | "groups"
  | "bookingServices"
  | "quotes"
  | "bookings"
  | "vendors"
  | "accounting"
> & {
  users: UserService
  customerFamilies: CustomerFamilyService
  groups: GroupService
  vendors: VendorService
  accounting: AccountingService
} {
  const accounting = createAccountingService(db)

  return {
    auth: createAuthService(db),
    users: createUserService(db),
    ...createCrmServices(db),
    ...createCommercialServices(db, {
      onBookingConfirmed: async (ctx, event) => {
        await accounting.handleBookingConfirmed(ctx, event)
      },
    }),
    ...createVendorServices(db, {
      onVendorBillPosted: async (ctx, event) => {
        await accounting.handleVendorBillPosted(ctx, event)
      },
      onVendorPaymentRecorded: async (ctx, event) => {
        await accounting.handleVendorPaymentRecorded(ctx, event)
      },
    }),
    accounting,
  }
}

export type MeridianServiceRegistry = ReturnType<typeof createMeridianServices>

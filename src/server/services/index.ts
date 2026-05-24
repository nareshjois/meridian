export * from "./_types"
export * from "./auth.contract"
export * from "./crm.contract"
export * from "./commercial.contract"
export * from "./vendors.contract"
export * from "./forms.contract"
export * from "./accounting.contract"

import type { AccountingServiceContract } from "./accounting.contract"
import type {
  AuthServiceContract,
  UserServiceContract,
} from "./auth.contract"
import type {
  BookingServiceCatalogContract,
  BookingServiceContract,
  QuoteServiceContract,
} from "./commercial.contract"
import type {
  CustomerFamilyServiceContract,
  CustomerServiceContract,
  GroupServiceContract,
} from "./crm.contract"
import type { FormServiceContract } from "./forms.contract"
import type { VendorServiceContract } from "./vendors.contract"

/** Frozen service registry consumed by route loaders/actions and downstream teams. */
export type MeridianServices = {
  auth: AuthServiceContract
  users: UserServiceContract
  customers: CustomerServiceContract
  customerFamilies: CustomerFamilyServiceContract
  groups: GroupServiceContract
  bookingServices: BookingServiceCatalogContract
  quotes: QuoteServiceContract
  bookings: BookingServiceContract
  vendors: VendorServiceContract
  forms: FormServiceContract
  accounting: AccountingServiceContract
}

export type MeridianServiceName = keyof MeridianServices

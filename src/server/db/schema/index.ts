export * from "./_common"
export * from "./auth"
export * from "./crm"
export * from "./customer-families"
export * from "./groups"
export * from "./booking-services"
export * from "./quotes"
export * from "./bookings"
export * from "./vendors"
export * from "./forms"
export * from "./accounting"

import { accountingTables } from "./accounting"
import { authTables } from "./auth"
import { bookingServiceTables } from "./booking-services"
import { bookingTables } from "./bookings"
import { crmTables } from "./crm"
import { customerFamilyTables } from "./customer-families"
import { formTables } from "./forms"
import { groupTables } from "./groups"
import { quoteTables } from "./quotes"
import { vendorTables } from "./vendors"

/** Frozen table registry for downstream migration and repository workstreams. */
export const meridianSchema = {
  ...authTables,
  ...crmTables,
  ...customerFamilyTables,
  ...groupTables,
  ...bookingServiceTables,
  ...quoteTables,
  ...bookingTables,
  ...vendorTables,
  ...formTables,
  ...accountingTables,
} as const

export type MeridianTableName = keyof typeof meridianSchema

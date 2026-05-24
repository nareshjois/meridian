import type { MeridianDb } from "@/server/db/client"
import type { MeridianServices } from "@/server/services"

import { createCustomerFamilyService } from "@/server/services/customer-families/customer-family.service"
import type { CustomerFamilyService } from "@/server/services/customer-families/customer-family.service"
import { createCustomerService } from "@/server/services/customers/customer.service"
import type { CustomerService } from "@/server/services/customers/customer.service"
import { createGroupService } from "@/server/services/groups/group.service"
import type { GroupService } from "@/server/services/groups/group.service"

export function createCrmServices(db: MeridianDb): Pick<
  MeridianServices,
  "customers" | "customerFamilies" | "groups"
> & {
  customers: CustomerService
  customerFamilies: CustomerFamilyService
  groups: GroupService
} {
  return {
    customers: createCustomerService(db),
    customerFamilies: createCustomerFamilyService(db),
    groups: createGroupService(db),
  }
}

export type { CustomerService, CustomerFamilyService, GroupService }

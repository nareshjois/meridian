import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
  VoidMutationResult,
} from "./_types"
import type {
  CustomerCreateInput,
  CustomerFamilyCreateInput,
  CustomerFamilyMemberInput,
  CustomerListQuery,
  CustomerUpdateInput,
  GroupMemberInput,
  TravelGroupCreateInput,
} from "@/shared/validation/dtos/crm"
import type { Customer } from "@/server/db/schema/crm"
import type {
  CustomerFamily,
  CustomerFamilyMember,
} from "@/server/db/schema/customer-families"
import type { GroupMember, TravelGroup } from "@/server/db/schema/groups"

export interface CustomerServiceContract {
  listCustomers(
    ctx: ServiceContext,
    query: CustomerListQuery,
  ): Promise<ListResult<Customer>>
  getCustomerById(
    ctx: ServiceContext,
    customerId: string,
  ): Promise<ServiceResult<Customer>>
  createCustomer(
    ctx: ServiceContext,
    input: CustomerCreateInput,
  ): Promise<MutationResult<Customer>>
  updateCustomer(
    ctx: ServiceContext,
    customerId: string,
    input: CustomerUpdateInput,
  ): Promise<MutationResult<Customer>>
}

export interface CustomerFamilyServiceContract {
  listFamilies(
    ctx: ServiceContext,
    query: { search?: string },
  ): Promise<ListResult<CustomerFamily>>
  createFamily(
    ctx: ServiceContext,
    input: CustomerFamilyCreateInput,
  ): Promise<MutationResult<CustomerFamily>>
  addMember(
    ctx: ServiceContext,
    input: CustomerFamilyMemberInput,
  ): Promise<MutationResult<CustomerFamilyMember>>
  removeMember(
    ctx: ServiceContext,
    input: { familyId: string; customerId: string },
  ): Promise<VoidMutationResult>
}

export interface GroupServiceContract {
  listGroups(
    ctx: ServiceContext,
    query: { search?: string; status?: TravelGroup["status"] },
  ): Promise<ListResult<TravelGroup>>
  createGroup(
    ctx: ServiceContext,
    input: TravelGroupCreateInput,
  ): Promise<MutationResult<TravelGroup>>
  addMember(
    ctx: ServiceContext,
    input: GroupMemberInput,
  ): Promise<MutationResult<GroupMember>>
  removeMember(
    ctx: ServiceContext,
    input: { groupId: string; customerId: string },
  ): Promise<VoidMutationResult>
}

export type { CustomerServiceContract as CustomerService }
export type { CustomerFamilyServiceContract as CustomerFamilyService }
export type { GroupServiceContract as GroupService }

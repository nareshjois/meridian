import type { MeridianDb } from "@/server/db/client"
import type { CustomerFamilyServiceContract } from "@/server/services/crm.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceContext,
  type ServiceResult,
} from "@/server/services/_types"
import { createCustomerRepository } from "@/server/services/customers/repository"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"

import {
  createCustomerFamilyRepository,
  type FamilyMemberDetail,
} from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createCustomerFamilyService(db: MeridianDb): CustomerFamilyServiceContract & {
  getFamilyDetail: (
    ctx: ServiceContext,
    familyId: string,
  ) => Promise<ServiceResult<NonNullable<Awaited<ReturnType<
    ReturnType<typeof createCustomerFamilyRepository>["findFamilyById"]
  >>>>>
  listMembers: (
    ctx: ServiceContext,
    familyId: string,
  ) => Promise<ServiceResult<FamilyMemberDetail[]>>
} {
  const repo = createCustomerFamilyRepository(db)
  const customers = createCustomerRepository(db)

  return {
    async listFamilies(ctx, query) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["customer_families.read"])
      ) {
        return forbidden("Missing permission to list customer families.")
      }

      const result = await repo.listFamilies(ctx.agencyId, query)

      return serviceOk({
        items: result.items,
        page: 1,
        pageSize: Math.max(result.total, 1),
        total: result.total,
      })
    },

    async createFamily(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["customer_families.write"])
      ) {
        return forbidden("Missing permission to create customer families.")
      }

      const family = await repo.createFamily(ctx.agencyId, input)
      return serviceOk(family)
    },

    async addMember(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["customer_families.write"])
      ) {
        return forbidden("Missing permission to manage family members.")
      }

      const family = await repo.findFamilyById(ctx.agencyId, input.familyId)
      if (!family) {
        return serviceErr({ code: "NOT_FOUND", message: "Family not found." })
      }

      const customer = await customers.findCustomerById(
        ctx.agencyId,
        input.customerId,
      )
      if (!customer) {
        return serviceErr({ code: "NOT_FOUND", message: "Customer not found." })
      }

      const existing = await repo.findMember(
        ctx.agencyId,
        input.familyId,
        input.customerId,
      )
      if (existing) {
        return serviceErr({
          code: "CONFLICT",
          message: "Customer is already a member of this family.",
        })
      }

      const member = await repo.addMember(ctx.agencyId, input)
      return serviceOk(member)
    },

    async removeMember(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["customer_families.write"])
      ) {
        return forbidden("Missing permission to manage family members.")
      }

      const family = await repo.findFamilyById(ctx.agencyId, input.familyId)
      if (!family) {
        return serviceErr({ code: "NOT_FOUND", message: "Family not found." })
      }

      const existing = await repo.findMember(
        ctx.agencyId,
        input.familyId,
        input.customerId,
      )
      if (!existing) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Family member not found.",
        })
      }

      await repo.removeMember(ctx.agencyId, input.familyId, input.customerId)
      return serviceOk({ success: true })
    },

    async getFamilyDetail(ctx, familyId) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["customer_families.read"])
      ) {
        return forbidden("Missing permission to view customer families.")
      }

      const family = await repo.findFamilyById(ctx.agencyId, familyId)
      if (!family) {
        return serviceErr({ code: "NOT_FOUND", message: "Family not found." })
      }

      return serviceOk(family)
    },

    async listMembers(ctx, familyId) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["customer_families.read"])
      ) {
        return forbidden("Missing permission to view family members.")
      }

      const family = await repo.findFamilyById(ctx.agencyId, familyId)
      if (!family) {
        return serviceErr({ code: "NOT_FOUND", message: "Family not found." })
      }

      const items = await repo.listMembers(ctx.agencyId, familyId)
      return serviceOk(items)
    },
  }
}

export type CustomerFamilyService = ReturnType<typeof createCustomerFamilyService>

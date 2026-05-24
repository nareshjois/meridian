import type { MeridianDb } from "@/server/db/client"
import type { GroupServiceContract } from "@/server/services/crm.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceContext,
  type ServiceResult,
} from "@/server/services/_types"
import { createCustomerRepository } from "@/server/services/customers/repository"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"

import { createGroupRepository, type GroupMemberDetail } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createGroupService(db: MeridianDb): GroupServiceContract & {
  getGroupDetail: (
    ctx: ServiceContext,
    groupId: string,
  ) => Promise<
    ServiceResult<
      NonNullable<
        Awaited<
          ReturnType<
            ReturnType<typeof createGroupRepository>["findGroupById"]
          >
        >
      >
    >
  >
  listMembers: (
    ctx: ServiceContext,
    groupId: string,
  ) => Promise<ServiceResult<GroupMemberDetail[]>>
} {
  const repo = createGroupRepository(db)
  const customers = createCustomerRepository(db)

  return {
    async listGroups(ctx, query) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["groups.read"])) {
        return forbidden("Missing permission to list groups.")
      }

      const result = await repo.listGroups(ctx.agencyId, query)

      return serviceOk({
        items: result.items,
        page: 1,
        pageSize: Math.max(result.total, 1),
        total: result.total,
      })
    },

    async createGroup(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["groups.write"])) {
        return forbidden("Missing permission to create groups.")
      }

      const group = await repo.createGroup(ctx.agencyId, input)
      return serviceOk(group)
    },

    async addMember(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["groups.write"])) {
        return forbidden("Missing permission to manage group members.")
      }

      const group = await repo.findGroupById(ctx.agencyId, input.groupId)
      if (!group) {
        return serviceErr({ code: "NOT_FOUND", message: "Group not found." })
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
        input.groupId,
        input.customerId,
      )
      if (existing) {
        return serviceErr({
          code: "CONFLICT",
          message: "Customer is already a member of this group.",
        })
      }

      const member = await repo.addMember(ctx.agencyId, input)
      return serviceOk(member)
    },

    async removeMember(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["groups.write"])) {
        return forbidden("Missing permission to manage group members.")
      }

      const group = await repo.findGroupById(ctx.agencyId, input.groupId)
      if (!group) {
        return serviceErr({ code: "NOT_FOUND", message: "Group not found." })
      }

      const existing = await repo.findMember(
        ctx.agencyId,
        input.groupId,
        input.customerId,
      )
      if (!existing) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Group member not found.",
        })
      }

      await repo.removeMember(ctx.agencyId, input.groupId, input.customerId)
      return serviceOk({ success: true })
    },

    async getGroupDetail(ctx, groupId) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["groups.read"])) {
        return forbidden("Missing permission to view groups.")
      }

      const group = await repo.findGroupById(ctx.agencyId, groupId)
      if (!group) {
        return serviceErr({ code: "NOT_FOUND", message: "Group not found." })
      }

      return serviceOk(group)
    },

    async listMembers(ctx, groupId) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["groups.read"])) {
        return forbidden("Missing permission to view group members.")
      }

      const group = await repo.findGroupById(ctx.agencyId, groupId)
      if (!group) {
        return serviceErr({ code: "NOT_FOUND", message: "Group not found." })
      }

      const items = await repo.listMembers(ctx.agencyId, groupId)
      return serviceOk(items)
    },
  }
}

export type GroupService = ReturnType<typeof createGroupService>

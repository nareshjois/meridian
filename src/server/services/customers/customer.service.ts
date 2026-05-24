import type { MeridianDb } from "@/server/db/client"
import type { CustomerServiceContract } from "@/server/services/crm.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { CustomerListQuery } from "@/shared/validation/dtos/crm"

import { createCustomerRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createCustomerService(db: MeridianDb): CustomerServiceContract {
  const repo = createCustomerRepository(db)

  return {
    async listCustomers(ctx, query: CustomerListQuery) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["customers.read"])) {
        return forbidden("Missing permission to list customers.")
      }

      const result = await repo.listCustomers(ctx.agencyId, query)

      return serviceOk({
        items: result.items,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      })
    },

    async getCustomerById(ctx, customerId) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["customers.read"])) {
        return forbidden("Missing permission to view customers.")
      }

      const customer = await repo.findCustomerById(ctx.agencyId, customerId)
      if (!customer) {
        return serviceErr({ code: "NOT_FOUND", message: "Customer not found." })
      }

      return serviceOk(customer)
    },

    async createCustomer(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["customers.write"])) {
        return forbidden("Missing permission to create customers.")
      }

      const customer = await repo.createCustomer(ctx.agencyId, input)
      return serviceOk(customer)
    },

    async updateCustomer(ctx, customerId, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["customers.write"])) {
        return forbidden("Missing permission to update customers.")
      }

      const customer = await repo.updateCustomer(ctx.agencyId, customerId, input)
      if (!customer) {
        return serviceErr({ code: "NOT_FOUND", message: "Customer not found." })
      }

      return serviceOk(customer)
    },
  }
}

export type CustomerService = ReturnType<typeof createCustomerService>

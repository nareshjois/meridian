import type { MeridianDb } from "@/server/db/client"
import type { BookingServiceCatalogContract } from "@/server/services/commercial.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"

import { createBookingServiceRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createBookingServiceCatalog(
  db: MeridianDb,
): BookingServiceCatalogContract {
  const repo = createBookingServiceRepository(db)

  return {
    async listServices(ctx, query) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["booking_services.read"])
      ) {
        return forbidden("Missing permission to list booking services.")
      }

      const items = await repo.listServices(
        ctx.agencyId,
        query.includeInactive ?? false,
      )

      return serviceOk({
        items,
        page: 1,
        pageSize: Math.max(items.length, 1),
        total: items.length,
      })
    },

    async createService(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["booking_services.write"])
      ) {
        return forbidden("Missing permission to create booking services.")
      }

      const code = input.code.trim().toUpperCase()
      const existing = await repo.findByCode(ctx.agencyId, code)
      if (existing) {
        return serviceErr({
          code: "CONFLICT",
          message: `Booking service code "${code}" already exists.`,
        })
      }

      const service = await repo.createService(ctx.agencyId, input)
      return serviceOk(service)
    },

    async setServiceActive(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["booking_services.write"])
      ) {
        return forbidden("Missing permission to update booking services.")
      }

      const service = await repo.findById(ctx.agencyId, input.serviceId)
      if (!service) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Booking service not found.",
        })
      }

      const updated = await repo.setActive(
        ctx.agencyId,
        input.serviceId,
        input.isActive,
      )
      if (!updated) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Booking service not found.",
        })
      }

      return serviceOk(updated)
    },

    async getServiceById(ctx, serviceId) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["booking_services.read"])
      ) {
        return forbidden("Missing permission to view booking services.")
      }

      const service = await repo.findById(ctx.agencyId, serviceId)
      if (!service) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Booking service not found.",
        })
      }

      return serviceOk(service)
    },

    async updateServiceFields(ctx, input) {
      if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["booking_services.write"])
      ) {
        return forbidden("Missing permission to update booking services.")
      }

      const service = await repo.findById(ctx.agencyId, input.serviceId)
      if (!service) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Booking service not found.",
        })
      }

      const quoteKeys = new Set<string>()
      for (const field of input.quoteFields) {
        if (quoteKeys.has(field.key)) {
          return serviceErr({
            code: "VALIDATION_ERROR",
            message: `Duplicate quote field key "${field.key}".`,
          })
        }
        quoteKeys.add(field.key)
      }

      const bookingKeys = new Set<string>()
      for (const field of input.bookingFields) {
        if (bookingKeys.has(field.key)) {
          return serviceErr({
            code: "VALIDATION_ERROR",
            message: `Duplicate booking field key "${field.key}".`,
          })
        }
        bookingKeys.add(field.key)
      }

      const updated = await repo.updateFieldSchemas(ctx.agencyId, input.serviceId, {
        quoteFields: input.quoteFields,
        bookingFields: input.bookingFields,
      })
      if (!updated) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Booking service not found.",
        })
      }

      return serviceOk(updated)
    },
  }
}

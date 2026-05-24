import type { MeridianDb } from "@/server/db/client"
import type { BookingServiceContract } from "@/server/services/commercial.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { createCustomerRepository } from "@/server/services/customers/repository"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { BookingStatusTransitionInput } from "@/shared/validation/dtos/commercial"
import {
  COMMERCIAL_EVENT_TYPES,
  type BookingConfirmedEvent,
  type BookingStatusChangedEvent,
} from "@/shared/validation/dtos/commercial-events"

import type { CommercialAccountingPublisher } from "../commercial"
import { publishCommercialEvent } from "../commercial/events"
import { createBookingRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

const BOOKING_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

export function createBookingService(
  db: MeridianDb,
  publisher: CommercialAccountingPublisher = {},
): BookingServiceContract {
  const repo = createBookingRepository(db)
  const customers = createCustomerRepository(db)

  return {
    async listBookings(ctx, query) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["bookings.read"])) {
        return forbidden("Missing permission to list bookings.")
      }

      const result = await repo.listBookings(ctx.agencyId, query)
      return serviceOk({
        items: result.items,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      })
    },

    async getBookingById(ctx, bookingId) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["bookings.read"])) {
        return forbidden("Missing permission to view bookings.")
      }

      const booking = await repo.findBookingById(ctx.agencyId, bookingId)
      if (!booking) {
        return serviceErr({ code: "NOT_FOUND", message: "Booking not found." })
      }

      return serviceOk(booking)
    },

    async transitionBookingStatus(ctx, input: BookingStatusTransitionInput) {
      const booking = await repo.findBookingById(ctx.agencyId, input.bookingId)
      if (!booking) {
        return serviceErr({ code: "NOT_FOUND", message: "Booking not found." })
      }

      const allowed = BOOKING_TRANSITIONS[booking.status] ?? []
      if (!allowed.includes(input.status)) {
        return serviceErr({
          code: "INVARIANT_VIOLATION",
          message: `Cannot move booking from ${booking.status} to ${input.status}.`,
        })
      }

      if (input.status === "confirmed") {
        if (
          !hasPermission(ctx.permissions, PERMISSION_KEYS["bookings.confirm"])
        ) {
          return forbidden("Missing permission to confirm bookings.")
        }
      } else if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["bookings.write"])
      ) {
        return forbidden("Missing permission to update bookings.")
      }

      const fromStatus = booking.status
      await repo.updateStatus(ctx.agencyId, input.bookingId, input.status)
      await repo.recordStatusChange({
        agencyId: ctx.agencyId,
        bookingId: input.bookingId,
        fromStatus,
        toStatus: input.status,
        changedByUserId: ctx.actorUserId,
        note: input.note,
      })

      const occurredAt = new Date()
      const base = {
        agencyId: ctx.agencyId,
        occurredAt,
        actorUserId: ctx.actorUserId,
      }

      const statusEvent: BookingStatusChangedEvent = {
        ...base,
        eventType: COMMERCIAL_EVENT_TYPES.bookingStatusChanged,
        bookingId: booking.id,
        fromStatus,
        toStatus: input.status,
        note: input.note,
      }
      publishCommercialEvent(statusEvent)

      if (input.status === "confirmed") {
        const confirmedEvent: BookingConfirmedEvent = {
          ...base,
          eventType: COMMERCIAL_EVENT_TYPES.bookingConfirmed,
          bookingId: booking.id,
          customerId: booking.customerId,
          bookingNumber: booking.bookingNumber,
          currency: booking.currency,
          totalReceivableCents: booking.totalCents,
        }
        publishCommercialEvent(confirmedEvent)
        await publisher.onBookingConfirmed?.(ctx, confirmedEvent)
      }

      const updated = await repo.findBookingById(ctx.agencyId, input.bookingId)
      return serviceOk(updated!)
    },

    async assignTraveler(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["bookings.write"])) {
        return forbidden("Missing permission to assign travelers.")
      }

      const booking = await repo.findBookingById(ctx.agencyId, input.bookingId)
      if (!booking) {
        return serviceErr({ code: "NOT_FOUND", message: "Booking not found." })
      }

      const customer = await customers.findCustomerById(
        ctx.agencyId,
        input.customerId,
      )
      if (!customer) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Traveler customer not found.",
        })
      }

      const traveler = await repo.assignTraveler({
        agencyId: ctx.agencyId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        travelerRole: input.travelerRole,
      })

      return serviceOk(traveler)
    },

    async removeTraveler(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["bookings.write"])) {
        return forbidden("Missing permission to remove travelers.")
      }

      const booking = await repo.findBookingById(ctx.agencyId, input.bookingId)
      if (!booking) {
        return serviceErr({ code: "NOT_FOUND", message: "Booking not found." })
      }

      await repo.removeTraveler(
        ctx.agencyId,
        input.bookingId,
        input.travelerId,
      )
      return serviceOk({ success: true })
    },
  }
}

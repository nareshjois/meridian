import { eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { quoteVersions } from "@/server/db/schema/quotes"
import type { QuoteServiceContract } from "@/server/services/commercial.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { createCustomerRepository } from "@/server/services/customers/repository"
import { hasPermission, PERMISSION_KEYS } from "@/shared/permissions"
import type { QuoteStatusTransitionInput } from "@/shared/validation/dtos/commercial"
import {
  COMMERCIAL_EVENT_TYPES,
  type QuoteAcceptedEvent,
  type QuoteConvertedEvent,
  type QuoteDeclinedEvent,
  type QuoteSentEvent,
} from "@/shared/validation/dtos/commercial-events"

import { publishCommercialEvent } from "../commercial/events"
import { createBookingRepository } from "../bookings/repository"
import { createQuoteRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

const QUOTE_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["sent"],
  sent: ["accepted", "declined", "expired"],
  accepted: [],
  declined: [],
  expired: [],
}

export type QuoteService = QuoteServiceContract

export function createQuoteService(db: MeridianDb): QuoteService {
  const repo = createQuoteRepository(db)
  const customers = createCustomerRepository(db)
  const bookings = createBookingRepository(db)

  return {
    async listQuotes(ctx, query) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["quotes.read"])) {
        return forbidden("Missing permission to list quotes.")
      }

      const result = await repo.listQuotes(ctx.agencyId, query)
      return serviceOk({
        items: result.items,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      })
    },

    async getQuoteById(ctx, quoteId) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["quotes.read"])) {
        return forbidden("Missing permission to view quotes.")
      }

      const quote = await repo.findQuoteById(ctx.agencyId, quoteId)
      if (!quote) {
        return serviceErr({ code: "NOT_FOUND", message: "Quote not found." })
      }

      return serviceOk(quote)
    },

    async createQuote(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["quotes.write"])) {
        return forbidden("Missing permission to create quotes.")
      }

      const customer = await customers.findCustomerById(
        ctx.agencyId,
        input.customerId,
      )
      if (!customer) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Customer not found.",
        })
      }

      const serviceError = await repo.validateBookingServices(
        ctx.agencyId,
        input.items.map((item) => item.bookingServiceId),
      )
      if (serviceError) {
        return serviceErr({
          code: "VALIDATION_ERROR",
          message: serviceError,
        })
      }

      const quote = await repo.createQuote(
        ctx.agencyId,
        ctx.actorUserId,
        input,
      )
      return serviceOk(quote)
    },

    async transitionQuoteStatus(ctx, input: QuoteStatusTransitionInput) {
      const quote = await repo.findQuoteById(ctx.agencyId, input.quoteId)
      if (!quote) {
        return serviceErr({ code: "NOT_FOUND", message: "Quote not found." })
      }

      const allowed = QUOTE_TRANSITIONS[quote.status] ?? []
      if (!allowed.includes(input.status)) {
        return serviceErr({
          code: "INVARIANT_VIOLATION",
          message: `Cannot move quote from ${quote.status} to ${input.status}.`,
        })
      }

      if (input.status === "sent") {
        if (!hasPermission(ctx.permissions, PERMISSION_KEYS["quotes.send"])) {
          return forbidden("Missing permission to send quotes.")
        }
      } else if (
        !hasPermission(ctx.permissions, PERMISSION_KEYS["quotes.write"])
      ) {
        return forbidden("Missing permission to update quotes.")
      }

      await repo.updateQuoteStatus(ctx.agencyId, input.quoteId, input.status)

      const existingVersions = await db
        .select({ versionNumber: quoteVersions.versionNumber })
        .from(quoteVersions)
        .where(eq(quoteVersions.quoteId, input.quoteId))

      const nextVersion =
        existingVersions.reduce(
          (max, row) => Math.max(max, row.versionNumber),
          0,
        ) + 1

      await repo.recordVersion(
        ctx.agencyId,
        input.quoteId,
        nextVersion,
        ctx.actorUserId,
      )

      const occurredAt = new Date()
      const base = {
        agencyId: ctx.agencyId,
        occurredAt,
        actorUserId: ctx.actorUserId,
      }

      if (input.status === "sent") {
        const event: QuoteSentEvent = {
          ...base,
          eventType: COMMERCIAL_EVENT_TYPES.quoteSent,
          quoteId: quote.id,
          customerId: quote.customerId,
          quoteNumber: quote.quoteNumber,
          currency: quote.currency,
          totalCents: quote.totalCents,
        }
        publishCommercialEvent(event)
      }

      if (input.status === "accepted") {
        await repo.recordAcceptanceEvent({
          agencyId: ctx.agencyId,
          quoteId: input.quoteId,
          eventType: "accepted",
          actorUserId: ctx.actorUserId,
          note: input.note,
        })
        const event: QuoteAcceptedEvent = {
          ...base,
          eventType: COMMERCIAL_EVENT_TYPES.quoteAccepted,
          quoteId: quote.id,
          customerId: quote.customerId,
          quoteNumber: quote.quoteNumber,
          totalCents: quote.totalCents,
        }
        publishCommercialEvent(event)
      }

      if (input.status === "declined") {
        await repo.recordAcceptanceEvent({
          agencyId: ctx.agencyId,
          quoteId: input.quoteId,
          eventType: "declined",
          actorUserId: ctx.actorUserId,
          note: input.note,
        })
        const event: QuoteDeclinedEvent = {
          ...base,
          eventType: COMMERCIAL_EVENT_TYPES.quoteDeclined,
          quoteId: quote.id,
          customerId: quote.customerId,
          quoteNumber: quote.quoteNumber,
          note: input.note,
        }
        publishCommercialEvent(event)
      }

      const updated = await repo.findQuoteById(ctx.agencyId, input.quoteId)
      return serviceOk(updated!)
    },

    async convertToBooking(ctx, input) {
      if (!hasPermission(ctx.permissions, PERMISSION_KEYS["quotes.convert"])) {
        return forbidden("Missing permission to convert quotes to bookings.")
      }

      const quote = await repo.findQuoteById(ctx.agencyId, input.quoteId)
      if (!quote) {
        return serviceErr({ code: "NOT_FOUND", message: "Quote not found." })
      }

      if (quote.status !== "accepted") {
        return serviceErr({
          code: "INVARIANT_VIOLATION",
          message: "Only accepted quotes can be converted to bookings.",
        })
      }

      const existingBooking = await bookings.findByQuoteId(
        ctx.agencyId,
        input.quoteId,
      )
      if (existingBooking) {
        return serviceErr({
          code: "CONFLICT",
          message: "This quote has already been converted to a booking.",
        })
      }

      const booking = await bookings.createFromQuote({
        agencyId: ctx.agencyId,
        quote,
        groupId: input.groupId,
        actorUserId: ctx.actorUserId,
      })

      const event: QuoteConvertedEvent = {
        agencyId: ctx.agencyId,
        occurredAt: new Date(),
        actorUserId: ctx.actorUserId,
        eventType: COMMERCIAL_EVENT_TYPES.quoteConverted,
        quoteId: quote.id,
        bookingId: booking.id,
        customerId: quote.customerId,
        bookingNumber: booking.bookingNumber,
        totalCents: quote.totalCents,
      }
      publishCommercialEvent(event)

      return serviceOk(booking)
    },
  }
}

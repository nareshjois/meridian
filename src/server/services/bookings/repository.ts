import { and, count, desc, eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { customers } from "@/server/db/schema/crm"
import { bookingServices } from "@/server/db/schema/booking-services"
import {
  bookingItems,
  bookings,
  bookingStatusHistory,
  bookingTravelers,
} from "@/server/db/schema/bookings"
import {
  getEffectiveServiceFields,
  mergeFieldValuesForBookingConversion,
  parseFieldValuesJson,
  parseServiceFieldsJson,
  serializeFieldValues,
  validateFieldValues,
} from "@/shared/commercial/service-fields"
import type {
  BookingCreateInput,
  BookingItemInput,
  BookingListQuery,
} from "@/shared/validation/dtos/commercial"
import type { QuoteRepository } from "../quotes/repository"
import { createBookingServiceRepository } from "../booking-services/repository"
import { createCommercialAttachmentRepository } from "../commercial-attachments/repository"
import { vendors } from "@/server/db/schema/vendors"

import type { BookingSummary } from "@/server/services/commercial.contract"

type QuoteDetail = NonNullable<
  Awaited<ReturnType<QuoteRepository["findQuoteById"]>>
>

export function createBookingRepository(db: MeridianDb) {
  return {
    async listBookings(agencyId: string, query: BookingListQuery) {
      const filters = [eq(bookings.agencyId, agencyId)]

      if (query.customerId) {
        filters.push(eq(bookings.customerId, query.customerId))
      }
      if (query.status) {
        filters.push(eq(bookings.status, query.status))
      }

      const whereClause = and(...filters)

      const [totalRow] = await db
        .select({ total: count() })
        .from(bookings)
        .where(whereClause)

      const rows = await db
        .select({
          booking: bookings,
          customerDisplayName: customers.displayName,
        })
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .where(whereClause)
        .orderBy(desc(bookings.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)

      const summaries: BookingSummary[] = []
      for (const row of rows) {
        const items = await this.listBookingItems(row.booking.id)
        summaries.push({
          ...row.booking,
          customerDisplayName: row.customerDisplayName,
          totalCents: items.reduce(
            (sum, item) => sum + item.quantity * item.unitPriceCents,
            0,
          ),
        })
      }

      return {
        items: summaries,
        total: totalRow?.total ?? 0,
      }
    },

    async findBookingById(agencyId: string, bookingId: string) {
      const [row] = await db
        .select({
          booking: bookings,
          customerDisplayName: customers.displayName,
        })
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .where(and(eq(bookings.agencyId, agencyId), eq(bookings.id, bookingId)))
        .limit(1)

      if (!row) {
        return null
      }

      const items = await this.listBookingItems(bookingId)
      const attachmentRepo = createCommercialAttachmentRepository(db)
      const attachments = await attachmentRepo.listForEntity(
        agencyId,
        "booking",
        bookingId,
      )
      const statusHistory = await this.listStatusHistory(bookingId)
      const travelers = await this.listTravelers(bookingId)
      const totalCents = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceCents,
        0,
      )

      return {
        ...row.booking,
        items,
        documents: attachments.filter((row) => row.kind === "document"),
        vendorQuotes: attachments.filter((row) => row.kind === "vendor_quote"),
        statusHistory,
        travelers,
        totalCents,
        customerDisplayName: row.customerDisplayName,
      }
    },

    async findByQuoteId(agencyId: string, quoteId: string) {
      const [row] = await db
        .select()
        .from(bookings)
        .where(
          and(eq(bookings.agencyId, agencyId), eq(bookings.quoteId, quoteId)),
        )
        .limit(1)

      return row ?? null
    },

    async listBookingItems(bookingId: string) {
      return db
        .select()
        .from(bookingItems)
        .where(eq(bookingItems.bookingId, bookingId))
        .orderBy(bookingItems.sortOrder)
    },

    async listStatusHistory(bookingId: string) {
      return db
        .select()
        .from(bookingStatusHistory)
        .where(eq(bookingStatusHistory.bookingId, bookingId))
        .orderBy(desc(bookingStatusHistory.createdAt))
    },

    async listTravelers(bookingId: string) {
      return db
        .select()
        .from(bookingTravelers)
        .where(eq(bookingTravelers.bookingId, bookingId))
        .orderBy(bookingTravelers.createdAt)
    },

    async nextBookingNumber(agencyId: string) {
      const [row] = await db
        .select({ total: count() })
        .from(bookings)
        .where(eq(bookings.agencyId, agencyId))

      const next = (row?.total ?? 0) + 1
      return `B-${String(next).padStart(5, "0")}`
    },

    async validateBookingServices(
      agencyId: string,
      serviceIds: string[],
    ): Promise<string | null> {
      for (const serviceId of serviceIds) {
        const [row] = await db
          .select({ id: bookingServices.id })
          .from(bookingServices)
          .where(
            and(
              eq(bookingServices.agencyId, agencyId),
              eq(bookingServices.id, serviceId),
              eq(bookingServices.isActive, true),
            ),
          )
          .limit(1)

        if (!row) {
          return `Booking service ${serviceId} is missing or inactive.`
        }
      }

      return null
    },

    async validateBookingItemFields(
      agencyId: string,
      items: BookingItemInput[],
    ) {
      for (const item of items) {
        const [service] = await db
          .select({
            name: bookingServices.name,
            bookingFieldsSchemaJson: bookingServices.bookingFieldsSchemaJson,
          })
          .from(bookingServices)
          .where(
            and(
              eq(bookingServices.agencyId, agencyId),
              eq(bookingServices.id, item.bookingServiceId),
            ),
          )
          .limit(1)

        if (!service) {
          return `Booking service ${item.bookingServiceId} is missing.`
        }

        const schema = getEffectiveServiceFields(
          parseServiceFieldsJson(service.bookingFieldsSchemaJson),
        )
        const error = validateFieldValues(schema, item.fields ?? {}, "booking")
        if (error) {
          return `${service.name}: ${error}`
        }
      }

      return null
    },

    async validateVendorQuoteAttachments(
      agencyId: string,
      vendorQuotes: BookingCreateInput["vendorQuotes"],
    ) {
      if (!vendorQuotes?.length) {
        return null
      }

      for (const quote of vendorQuotes) {
        const [vendor] = await db
          .select({ id: vendors.id })
          .from(vendors)
          .where(
            and(
              eq(vendors.agencyId, agencyId),
              eq(vendors.id, quote.vendorId),
              eq(vendors.status, "active"),
            ),
          )
          .limit(1)

        if (!vendor) {
          return `Vendor ${quote.vendorId} is missing or inactive.`
        }
      }

      return null
    },

    async insertBookingItems(
      agencyId: string,
      bookingId: string,
      items: BookingItemInput[],
    ) {
      const now = new Date()
      let sortOrder = 0

      for (const item of items) {
        await db.insert(bookingItems).values({
          id: crypto.randomUUID(),
          agencyId,
          bookingId,
          bookingServiceId: item.bookingServiceId,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          sortOrder,
          fieldsJson: serializeFieldValues(item.fields ?? {}),
          createdAt: now,
          updatedAt: now,
        })
        sortOrder += 1
      }
    },

    async createBooking(
      agencyId: string,
      actorUserId: string,
      input: BookingCreateInput,
    ) {
      const bookingId = crypto.randomUUID()
      const now = new Date()
      const bookingNumber = await this.nextBookingNumber(agencyId)

      await db.insert(bookings).values({
        id: bookingId,
        agencyId,
        customerId: input.customerId,
        quoteId: null,
        groupId: input.groupId ?? null,
        bookingNumber,
        status: "draft",
        currency: input.currency,
        createdAt: now,
        updatedAt: now,
      })

      await this.insertBookingItems(agencyId, bookingId, input.items)
      await this.recordStatusChange({
        agencyId,
        bookingId,
        fromStatus: null,
        toStatus: "draft",
        changedByUserId: actorUserId,
        note: "Created directly",
      })

      const attachmentRepo = createCommercialAttachmentRepository(db)
      await attachmentRepo.insertDocuments(
        agencyId,
        "booking",
        bookingId,
        actorUserId,
        input.documents ?? [],
      )
      await attachmentRepo.insertVendorQuotes(
        agencyId,
        "booking",
        bookingId,
        actorUserId,
        input.vendorQuotes ?? [],
        (input.documents ?? []).length,
      )

      return (await this.findBookingById(agencyId, bookingId))!
    },

    async createFromQuote(input: {
      agencyId: string
      quote: QuoteDetail
      groupId?: string
      actorUserId: string
    }) {
      const bookingId = crypto.randomUUID()
      const now = new Date()
      const bookingNumber = await this.nextBookingNumber(input.agencyId)

      await db.insert(bookings).values({
        id: bookingId,
        agencyId: input.agencyId,
        customerId: input.quote.customerId,
        quoteId: input.quote.id,
        groupId: input.groupId ?? null,
        bookingNumber,
        status: "draft",
        currency: input.quote.currency,
        createdAt: now,
        updatedAt: now,
      })

      let sortOrder = 0
      const serviceRepo = createBookingServiceRepository(db)

      for (const item of input.quote.items) {
        const schemas = await serviceRepo.getFieldSchemas(
          input.agencyId,
          item.bookingServiceId,
        )
        const quoteValues = parseFieldValuesJson(item.fieldsJson)
        const mergedValues = schemas
          ? mergeFieldValuesForBookingConversion(
              quoteValues,
              schemas.quoteFields,
              schemas.bookingFields,
            )
          : quoteValues

        await db.insert(bookingItems).values({
          id: crypto.randomUUID(),
          agencyId: input.agencyId,
          bookingId,
          bookingServiceId: item.bookingServiceId,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          sortOrder,
          fieldsJson: serializeFieldValues(mergedValues),
          createdAt: now,
          updatedAt: now,
        })
        sortOrder += 1
      }

      await this.recordStatusChange({
        agencyId: input.agencyId,
        bookingId,
        fromStatus: null,
        toStatus: "draft",
        changedByUserId: input.actorUserId,
        note: "Created from quote conversion",
      })

      const attachmentRepo = createCommercialAttachmentRepository(db)
      await attachmentRepo.copyToEntity(
        input.agencyId,
        "quote",
        input.quote.id,
        "booking",
        bookingId,
        input.actorUserId,
      )

      return (await this.findBookingById(input.agencyId, bookingId))!
    },

    async recordStatusChange(input: {
      agencyId: string
      bookingId: string
      fromStatus: string | null
      toStatus: string
      changedByUserId: string
      note?: string
    }) {
      const now = new Date()
      await db.insert(bookingStatusHistory).values({
        id: crypto.randomUUID(),
        agencyId: input.agencyId,
        bookingId: input.bookingId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        changedByUserId: input.changedByUserId,
        note: input.note?.trim() ?? null,
        createdAt: now,
        updatedAt: now,
      })
    },

    async updateStatus(
      agencyId: string,
      bookingId: string,
      status: (typeof bookings.$inferSelect)["status"],
    ) {
      const now = new Date()
      await db
        .update(bookings)
        .set({ status, updatedAt: now })
        .where(and(eq(bookings.agencyId, agencyId), eq(bookings.id, bookingId)))
    },

    async assignTraveler(input: {
      agencyId: string
      bookingId: string
      customerId: string
      travelerRole: string
    }) {
      const id = crypto.randomUUID()
      const now = new Date()

      await db.insert(bookingTravelers).values({
        id,
        agencyId: input.agencyId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        travelerRole: input.travelerRole,
        createdAt: now,
        updatedAt: now,
      })

      const [row] = await db
        .select()
        .from(bookingTravelers)
        .where(eq(bookingTravelers.id, id))
        .limit(1)

      return row!
    },

    async removeTraveler(
      agencyId: string,
      bookingId: string,
      travelerId: string,
    ) {
      await db
        .delete(bookingTravelers)
        .where(
          and(
            eq(bookingTravelers.agencyId, agencyId),
            eq(bookingTravelers.bookingId, bookingId),
            eq(bookingTravelers.id, travelerId),
          ),
        )
    },

    async updateBookingItemFields(input: {
      agencyId: string
      bookingId: string
      itemId: string
      fields: Record<string, string>
    }) {
      const booking = await this.findBookingById(input.agencyId, input.bookingId)
      if (!booking) {
        return null
      }

      const item = booking.items.find((row) => row.id === input.itemId)
      if (!item) {
        return null
      }

      const serviceRepo = createBookingServiceRepository(db)
      const schemas = await serviceRepo.getFieldSchemas(
        input.agencyId,
        item.bookingServiceId,
      )
      if (!schemas) {
        return null
      }

      const error = validateFieldValues(
        schemas.bookingFields,
        input.fields,
        "booking",
      )
      if (error) {
        throw new Error(error)
      }

      const now = new Date()
      await db
        .update(bookingItems)
        .set({ fieldsJson: serializeFieldValues(input.fields), updatedAt: now })
        .where(
          and(
            eq(bookingItems.agencyId, input.agencyId),
            eq(bookingItems.bookingId, input.bookingId),
            eq(bookingItems.id, input.itemId),
          ),
        )

      return this.findBookingById(input.agencyId, input.bookingId)
    },
  }
}

export type BookingRepository = ReturnType<typeof createBookingRepository>

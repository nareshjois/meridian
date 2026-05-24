import { and, count, desc, eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { customers } from "@/server/db/schema/crm"
import { bookingServices } from "@/server/db/schema/booking-services"
import {
  quoteAcceptanceEvents,
  quoteItems,
  quoteVersions,
  quotes,
} from "@/server/db/schema/quotes"
import type {
  QuoteCreateInput,
  QuoteItemInput,
  QuoteListQuery,
} from "@/shared/validation/dtos/commercial"

import type { QuoteSummary } from "@/server/services/commercial.contract"

function lineTotalCents(item: QuoteItemInput) {
  return item.quantity * item.unitPriceCents
}

export function createQuoteRepository(db: MeridianDb) {
  return {
    async listQuotes(agencyId: string, query: QuoteListQuery) {
      const filters = [eq(quotes.agencyId, agencyId)]

      if (query.customerId) {
        filters.push(eq(quotes.customerId, query.customerId))
      }
      if (query.status) {
        filters.push(eq(quotes.status, query.status))
      }

      const whereClause = and(...filters)

      const [totalRow] = await db
        .select({ total: count() })
        .from(quotes)
        .where(whereClause)

      const rows = await db
        .select({
          quote: quotes,
          customerDisplayName: customers.displayName,
        })
        .from(quotes)
        .innerJoin(customers, eq(quotes.customerId, customers.id))
        .where(whereClause)
        .orderBy(desc(quotes.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)

      const summaries: QuoteSummary[] = []
      for (const row of rows) {
        const items = await this.listQuoteItems(row.quote.id)
        summaries.push({
          ...row.quote,
          validUntil: row.quote.validUntil ?? null,
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

    async findQuoteById(agencyId: string, quoteId: string) {
      const [row] = await db
        .select({
          quote: quotes,
          customerDisplayName: customers.displayName,
        })
        .from(quotes)
        .innerJoin(customers, eq(quotes.customerId, customers.id))
        .where(and(eq(quotes.agencyId, agencyId), eq(quotes.id, quoteId)))
        .limit(1)

      if (!row) {
        return null
      }

      const items = await this.listQuoteItems(quoteId)
      const totalCents = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceCents,
        0,
      )

      return {
        ...row.quote,
        items,
        totalCents,
        customerDisplayName: row.customerDisplayName,
      }
    },

    async listQuoteItems(quoteId: string) {
      return db
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, quoteId))
        .orderBy(quoteItems.sortOrder)
    },

    async nextQuoteNumber(agencyId: string) {
      const [row] = await db
        .select({ total: count() })
        .from(quotes)
        .where(eq(quotes.agencyId, agencyId))

      const next = (row?.total ?? 0) + 1
      return `Q-${String(next).padStart(5, "0")}`
    },

    async createQuote(
      agencyId: string,
      actorUserId: string,
      input: QuoteCreateInput,
    ) {
      const quoteId = crypto.randomUUID()
      const now = new Date()
      const quoteNumber = await this.nextQuoteNumber(agencyId)

      await db.insert(quotes).values({
        id: quoteId,
        agencyId,
        customerId: input.customerId,
        quoteNumber,
        status: "draft",
        currency: input.currency,
        validUntil: input.validUntil ?? null,
        notes: input.notes?.trim() ?? null,
        createdAt: now,
        updatedAt: now,
      })

      await this.insertQuoteItems(agencyId, quoteId, input.items)
      await this.recordVersion(agencyId, quoteId, 1, actorUserId)

      return (await this.findQuoteById(agencyId, quoteId))!
    },

    async insertQuoteItems(
      agencyId: string,
      quoteId: string,
      items: QuoteItemInput[],
    ) {
      const now = new Date()
      let sortOrder = 0

      for (const item of items) {
        await db.insert(quoteItems).values({
          id: crypto.randomUUID(),
          agencyId,
          quoteId,
          bookingServiceId: item.bookingServiceId,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        sortOrder += 1
      }
    },

    async recordVersion(
      agencyId: string,
      quoteId: string,
      versionNumber: number,
      actorUserId: string,
    ) {
      const detail = await this.findQuoteById(agencyId, quoteId)
      if (!detail) {
        return
      }

      const now = new Date()
      await db.insert(quoteVersions).values({
        id: crypto.randomUUID(),
        agencyId,
        quoteId,
        versionNumber,
        snapshotJson: JSON.stringify(detail),
        createdByUserId: actorUserId,
        createdAt: now,
        updatedAt: now,
      })
    },

    async updateQuoteStatus(
      agencyId: string,
      quoteId: string,
      status: (typeof quotes.$inferSelect)["status"],
    ) {
      const now = new Date()
      await db
        .update(quotes)
        .set({ status, updatedAt: now })
        .where(and(eq(quotes.agencyId, agencyId), eq(quotes.id, quoteId)))
    },

    async recordAcceptanceEvent(input: {
      agencyId: string
      quoteId: string
      eventType: "accepted" | "declined"
      actorUserId: string
      note?: string
    }) {
      const now = new Date()
      await db.insert(quoteAcceptanceEvents).values({
        id: crypto.randomUUID(),
        agencyId: input.agencyId,
        quoteId: input.quoteId,
        eventType: input.eventType,
        actorType: "user",
        actorId: input.actorUserId,
        note: input.note?.trim() ?? null,
        createdAt: now,
        updatedAt: now,
      })
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

    sumItems(items: QuoteItemInput[]) {
      return items.reduce((sum, item) => sum + lineTotalCents(item), 0)
    },
  }
}

export type QuoteRepository = ReturnType<typeof createQuoteRepository>

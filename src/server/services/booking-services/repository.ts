import { and, asc, count, eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { bookingServices } from "@/server/db/schema/booking-services"
import {
  getCustomFieldsOnly,
  getEffectiveServiceFields,
  parseServiceFieldsJson,
  serializeServiceFields,
} from "@/shared/commercial/service-fields"
import type {
  BookingServiceCreateInput,
  BookingServiceFieldsInput,
} from "@/shared/validation/dtos/commercial"

export function createBookingServiceRepository(db: MeridianDb) {
  return {
    async listServices(agencyId: string, includeInactive: boolean) {
      const filters = [eq(bookingServices.agencyId, agencyId)]
      if (!includeInactive) {
        filters.push(eq(bookingServices.isActive, true))
      }

      return db
        .select()
        .from(bookingServices)
        .where(and(...filters))
        .orderBy(asc(bookingServices.name))
    },

    async findById(agencyId: string, serviceId: string) {
      const [row] = await db
        .select()
        .from(bookingServices)
        .where(
          and(
            eq(bookingServices.agencyId, agencyId),
            eq(bookingServices.id, serviceId),
          ),
        )
        .limit(1)

      return row ?? null
    },

    async findByCode(agencyId: string, code: string) {
      const [row] = await db
        .select()
        .from(bookingServices)
        .where(
          and(
            eq(bookingServices.agencyId, agencyId),
            eq(bookingServices.code, code),
          ),
        )
        .limit(1)

      return row ?? null
    },

    async createService(agencyId: string, input: BookingServiceCreateInput) {
      const id = crypto.randomUUID()
      const now = new Date()

      await db.insert(bookingServices).values({
        id,
        agencyId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        category: input.category.trim(),
        isActive: true,
        defaultRevenueAccountId: input.defaultRevenueAccountId ?? null,
        quoteFieldsSchemaJson: serializeServiceFields(input.quoteFields ?? []),
        bookingFieldsSchemaJson: serializeServiceFields(
          input.bookingFields ?? [],
        ),
        sameStartEndDefault: input.sameStartEndDefault ?? false,
        createdAt: now,
        updatedAt: now,
      })

      return (await this.findById(agencyId, id))!
    },

    async setActive(agencyId: string, serviceId: string, isActive: boolean) {
      const now = new Date()
      await db
        .update(bookingServices)
        .set({ isActive, updatedAt: now })
        .where(
          and(
            eq(bookingServices.agencyId, agencyId),
            eq(bookingServices.id, serviceId),
          ),
        )

      return this.findById(agencyId, serviceId)
    },

    async updateFieldSchemas(
      agencyId: string,
      serviceId: string,
      input: BookingServiceFieldsInput,
    ) {
      const quoteCustom = getCustomFieldsOnly(input.quoteFields)
      const bookingCustom = getCustomFieldsOnly(input.bookingFields)
      const now = new Date()
      await db
        .update(bookingServices)
        .set({
          quoteFieldsSchemaJson: serializeServiceFields(quoteCustom),
          bookingFieldsSchemaJson: serializeServiceFields(bookingCustom),
          updatedAt: now,
        })
        .where(
          and(
            eq(bookingServices.agencyId, agencyId),
            eq(bookingServices.id, serviceId),
          ),
        )

      return this.findById(agencyId, serviceId)
    },

    async updateSameStartEndDefault(
      agencyId: string,
      serviceId: string,
      sameStartEndDefault: boolean,
    ) {
      const now = new Date()
      await db
        .update(bookingServices)
        .set({ sameStartEndDefault, updatedAt: now })
        .where(
          and(
            eq(bookingServices.agencyId, agencyId),
            eq(bookingServices.id, serviceId),
          ),
        )

      return this.findById(agencyId, serviceId)
    },

    async getFieldSchemas(agencyId: string, serviceId: string) {
      const service = await this.findById(agencyId, serviceId)
      if (!service) {
        return null
      }

      const quoteCustom = parseServiceFieldsJson(service.quoteFieldsSchemaJson)
      const bookingCustom = parseServiceFieldsJson(
        service.bookingFieldsSchemaJson,
      )

      return {
        quoteFields: getEffectiveServiceFields(quoteCustom),
        bookingFields: getEffectiveServiceFields(bookingCustom),
        customQuoteFields: quoteCustom,
        customBookingFields: bookingCustom,
        sameStartEndDefault: service.sameStartEndDefault,
      }
    },

    async seedDefaultServices(
      agencyId: string,
      services: readonly BookingServiceCreateInput[],
    ) {
      for (const service of services) {
        const existing = await this.findByCode(agencyId, service.code)
        if (existing) {
          if (service.sameStartEndDefault != null) {
            await this.updateSameStartEndDefault(
              agencyId,
              existing.id,
              service.sameStartEndDefault,
            )
          }
          continue
        }
        await this.createService(agencyId, service)
      }
    },

    async countServices(agencyId: string) {
      const [row] = await db
        .select({ total: count() })
        .from(bookingServices)
        .where(eq(bookingServices.agencyId, agencyId))

      return row?.total ?? 0
    },
  }
}

export type BookingServiceRepository = ReturnType<
  typeof createBookingServiceRepository
>

import { and, count, desc, eq, like, or } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { bookings, bookingTravelers } from "@/server/db/schema/bookings"
import { customers } from "@/server/db/schema/crm"
import { formRequests } from "@/server/db/schema/forms"
import { quotes } from "@/server/db/schema/quotes"
import type {
  CustomerCreateInput,
  CustomerListQuery,
  CustomerUpdateInput,
} from "@/shared/validation/dtos/crm"

import {
  buildCustomerInsertValues,
  buildCustomerUpdateValues,
} from "./customer-values"

export type CustomerSummary = {
  id: string
  displayName: string
  email: string | null
  phoneCountryCode: string
  phone: string | null
  city: string | null
  countryCode: string
  status: "active" | "inactive"
}

export class CustomerRepository {
  constructor(private readonly db: MeridianDb) {}

  async listCustomers(agencyId: string, query: CustomerListQuery) {
    const filters = [eq(customers.agencyId, agencyId)]

    if (query.status) {
      filters.push(eq(customers.status, query.status))
    }

    if (query.search) {
      const pattern = `%${query.search.trim()}%`
      filters.push(
        or(
          like(customers.displayName, pattern),
          like(customers.email, pattern),
          like(customers.phone, pattern),
          like(customers.passportNumber, pattern),
          like(customers.city, pattern),
        )!,
      )
    }

    const whereClause = and(...filters)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(customers)
      .where(whereClause)

    const rows = await this.db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)

    return {
      items: rows,
      total: totalRow?.total ?? 0,
    }
  }

  async findCustomerById(agencyId: string, customerId: string) {
    const [row] = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.agencyId, agencyId), eq(customers.id, customerId)))
      .limit(1)

    return row ?? null
  }

  async createCustomer(agencyId: string, input: CustomerCreateInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db
      .insert(customers)
      .values(buildCustomerInsertValues(agencyId, input, id, now))

    const created = await this.findCustomerById(agencyId, id)
    if (!created) {
      throw new Error("Failed to create customer")
    }

    return created
  }

  async updateCustomer(
    agencyId: string,
    customerId: string,
    input: CustomerUpdateInput,
  ) {
    const existing = await this.findCustomerById(agencyId, customerId)
    if (!existing) {
      return null
    }

    await this.db
      .update(customers)
      .set(buildCustomerUpdateValues(existing, input))
      .where(eq(customers.id, customerId))

    return this.findCustomerById(agencyId, customerId)
  }

  async listCustomerPicker(agencyId: string, search?: string) {
    const filters = [
      eq(customers.agencyId, agencyId),
      eq(customers.status, "active"),
    ]

    if (search?.trim()) {
      const pattern = `%${search.trim()}%`
      filters.push(
        or(
          like(customers.displayName, pattern),
          like(customers.email, pattern),
        )!,
      )
    }

    return this.db
      .select({
        id: customers.id,
        displayName: customers.displayName,
      })
      .from(customers)
      .where(and(...filters))
      .orderBy(customers.displayName)
      .limit(50)
  }

  async getCustomerDeleteBlockers(agencyId: string, customerId: string) {
    const whereCustomer = and(
      eq(customers.agencyId, agencyId),
      eq(customers.id, customerId),
    )

    const [[quoteRow], [bookingRow], [travelerRow], [formRow]] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(quotes)
        .where(and(eq(quotes.agencyId, agencyId), eq(quotes.customerId, customerId))),
      this.db
        .select({ total: count() })
        .from(bookings)
        .where(
          and(eq(bookings.agencyId, agencyId), eq(bookings.customerId, customerId)),
        ),
      this.db
        .select({ total: count() })
        .from(bookingTravelers)
        .where(
          and(
            eq(bookingTravelers.agencyId, agencyId),
            eq(bookingTravelers.customerId, customerId),
          ),
        ),
      this.db
        .select({ total: count() })
        .from(formRequests)
        .where(
          and(
            eq(formRequests.agencyId, agencyId),
            eq(formRequests.customerId, customerId),
          ),
        ),
    ])

    const blockers: string[] = []
    const quoteCount = quoteRow?.total ?? 0
    const bookingCount = bookingRow?.total ?? 0
    const travelerCount = travelerRow?.total ?? 0
    const formCount = formRow?.total ?? 0

    if (quoteCount > 0) {
      blockers.push(`${quoteCount} quote${quoteCount === 1 ? "" : "s"}`)
    }
    if (bookingCount > 0) {
      blockers.push(`${bookingCount} booking${bookingCount === 1 ? "" : "s"}`)
    }
    if (travelerCount > 0) {
      blockers.push(
        `${travelerCount} booking traveler record${travelerCount === 1 ? "" : "s"}`,
      )
    }
    if (formCount > 0) {
      blockers.push(`${formCount} form request${formCount === 1 ? "" : "s"}`)
    }

    const [customerRow] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(whereCustomer)
      .limit(1)

    return {
      exists: Boolean(customerRow),
      blockers,
    }
  }

  async deleteCustomer(agencyId: string, customerId: string) {
    await this.db
      .delete(customers)
      .where(and(eq(customers.agencyId, agencyId), eq(customers.id, customerId)))
  }
}

export function createCustomerRepository(db: MeridianDb) {
  return new CustomerRepository(db)
}

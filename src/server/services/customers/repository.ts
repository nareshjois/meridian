import { and, count, desc, eq, like, or } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { customers } from "@/server/db/schema/crm"
import type {
  CustomerCreateInput,
  CustomerListQuery,
  CustomerUpdateInput,
} from "@/shared/validation/dtos/crm"

export type CustomerSummary = {
  id: string
  displayName: string
  email: string | null
  phone: string | null
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

    await this.db.insert(customers).values({
      id,
      agencyId,
      displayName: input.displayName.trim(),
      email: input.email?.trim().toLowerCase() ?? null,
      phone: input.phone?.trim() ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })

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
      .set({
        displayName: input.displayName?.trim() ?? existing.displayName,
        email:
          input.email !== undefined
            ? (input.email?.trim().toLowerCase() ?? null)
            : existing.email,
        phone:
          input.phone !== undefined
            ? (input.phone?.trim() ?? null)
            : existing.phone,
        status: input.status ?? existing.status,
        updatedAt: new Date(),
      })
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
}

export function createCustomerRepository(db: MeridianDb) {
  return new CustomerRepository(db)
}

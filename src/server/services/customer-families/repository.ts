import { and, count, desc, eq, like } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { customers } from "@/server/db/schema/crm"
import {
  customerFamilies,
  customerFamilyMembers,
} from "@/server/db/schema/customer-families"
import type {
  CustomerFamilyCreateInput,
  CustomerFamilyMemberInput,
} from "@/shared/validation/dtos/crm"

export type FamilyMemberDetail = {
  id: string
  customerId: string
  displayName: string
  role: "head" | "spouse" | "child" | "other"
}

export class CustomerFamilyRepository {
  constructor(private readonly db: MeridianDb) {}

  async listFamilies(agencyId: string, query: { search?: string }) {
    const filters = [eq(customerFamilies.agencyId, agencyId)]

    if (query.search?.trim()) {
      filters.push(like(customerFamilies.name, `%${query.search.trim()}%`))
    }

    const whereClause = and(...filters)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(customerFamilies)
      .where(whereClause)

    const rows = await this.db
      .select()
      .from(customerFamilies)
      .where(whereClause)
      .orderBy(desc(customerFamilies.createdAt))

    return {
      items: rows,
      total: totalRow?.total ?? 0,
    }
  }

  async findFamilyById(agencyId: string, familyId: string) {
    const [row] = await this.db
      .select()
      .from(customerFamilies)
      .where(
        and(
          eq(customerFamilies.agencyId, agencyId),
          eq(customerFamilies.id, familyId),
        ),
      )
      .limit(1)

    return row ?? null
  }

  async createFamily(agencyId: string, input: CustomerFamilyCreateInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(customerFamilies).values({
      id,
      agencyId,
      name: input.name.trim(),
      createdAt: now,
      updatedAt: now,
    })

    const created = await this.findFamilyById(agencyId, id)
    if (!created) {
      throw new Error("Failed to create customer family")
    }

    return created
  }

  async listMembers(agencyId: string, familyId: string): Promise<FamilyMemberDetail[]> {
    const rows = await this.db
      .select({
        id: customerFamilyMembers.id,
        customerId: customerFamilyMembers.customerId,
        displayName: customers.displayName,
        role: customerFamilyMembers.role,
      })
      .from(customerFamilyMembers)
      .innerJoin(customers, eq(customerFamilyMembers.customerId, customers.id))
      .where(
        and(
          eq(customerFamilyMembers.agencyId, agencyId),
          eq(customerFamilyMembers.familyId, familyId),
        ),
      )
      .orderBy(customers.displayName)

    return rows
  }

  async findMember(agencyId: string, familyId: string, customerId: string) {
    const [row] = await this.db
      .select()
      .from(customerFamilyMembers)
      .where(
        and(
          eq(customerFamilyMembers.agencyId, agencyId),
          eq(customerFamilyMembers.familyId, familyId),
          eq(customerFamilyMembers.customerId, customerId),
        ),
      )
      .limit(1)

    return row ?? null
  }

  async addMember(agencyId: string, input: CustomerFamilyMemberInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(customerFamilyMembers).values({
      id,
      agencyId,
      familyId: input.familyId,
      customerId: input.customerId,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    })

    const [row] = await this.db
      .select()
      .from(customerFamilyMembers)
      .where(eq(customerFamilyMembers.id, id))
      .limit(1)

    if (!row) {
      throw new Error("Failed to add family member")
    }

    return row
  }

  async removeMember(agencyId: string, familyId: string, customerId: string) {
    await this.db
      .delete(customerFamilyMembers)
      .where(
        and(
          eq(customerFamilyMembers.agencyId, agencyId),
          eq(customerFamilyMembers.familyId, familyId),
          eq(customerFamilyMembers.customerId, customerId),
        ),
      )
  }

  async deleteFamily(agencyId: string, familyId: string) {
    await this.db
      .delete(customerFamilies)
      .where(
        and(
          eq(customerFamilies.agencyId, agencyId),
          eq(customerFamilies.id, familyId),
        ),
      )
  }
}

export function createCustomerFamilyRepository(db: MeridianDb) {
  return new CustomerFamilyRepository(db)
}

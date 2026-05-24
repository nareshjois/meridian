import { and, count, desc, eq, like } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { bookings } from "@/server/db/schema/bookings"
import { customers } from "@/server/db/schema/crm"
import { groupMembers, travelGroups } from "@/server/db/schema/groups"
import type {
  GroupMemberInput,
  TravelGroupCreateInput,
} from "@/shared/validation/dtos/crm"

export type GroupMemberDetail = {
  id: string
  customerId: string
  displayName: string
  role: string
}

export class GroupRepository {
  constructor(private readonly db: MeridianDb) {}

  async listGroups(
    agencyId: string,
    query: { search?: string; status?: "planning" | "active" | "completed" },
  ) {
    const filters = [eq(travelGroups.agencyId, agencyId)]

    if (query.status) {
      filters.push(eq(travelGroups.status, query.status))
    }

    if (query.search?.trim()) {
      filters.push(like(travelGroups.name, `%${query.search.trim()}%`))
    }

    const whereClause = and(...filters)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(travelGroups)
      .where(whereClause)

    const rows = await this.db
      .select()
      .from(travelGroups)
      .where(whereClause)
      .orderBy(desc(travelGroups.createdAt))

    return {
      items: rows,
      total: totalRow?.total ?? 0,
    }
  }

  async findGroupById(agencyId: string, groupId: string) {
    const [row] = await this.db
      .select()
      .from(travelGroups)
      .where(
        and(eq(travelGroups.agencyId, agencyId), eq(travelGroups.id, groupId)),
      )
      .limit(1)

    return row ?? null
  }

  async createGroup(agencyId: string, input: TravelGroupCreateInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(travelGroups).values({
      id,
      agencyId,
      name: input.name.trim(),
      status: "planning",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    })

    const created = await this.findGroupById(agencyId, id)
    if (!created) {
      throw new Error("Failed to create travel group")
    }

    return created
  }

  async listMembers(agencyId: string, groupId: string): Promise<GroupMemberDetail[]> {
    const rows = await this.db
      .select({
        id: groupMembers.id,
        customerId: groupMembers.customerId,
        displayName: customers.displayName,
        role: groupMembers.role,
      })
      .from(groupMembers)
      .innerJoin(customers, eq(groupMembers.customerId, customers.id))
      .where(
        and(
          eq(groupMembers.agencyId, agencyId),
          eq(groupMembers.groupId, groupId),
        ),
      )
      .orderBy(customers.displayName)

    return rows
  }

  async findMember(agencyId: string, groupId: string, customerId: string) {
    const [row] = await this.db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.agencyId, agencyId),
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.customerId, customerId),
        ),
      )
      .limit(1)

    return row ?? null
  }

  async addMember(agencyId: string, input: GroupMemberInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(groupMembers).values({
      id,
      agencyId,
      groupId: input.groupId,
      customerId: input.customerId,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    })

    const [row] = await this.db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.id, id))
      .limit(1)

    if (!row) {
      throw new Error("Failed to add group member")
    }

    return row
  }

  async removeMember(agencyId: string, groupId: string, customerId: string) {
    await this.db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.agencyId, agencyId),
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.customerId, customerId),
        ),
      )
  }

  async deleteGroup(agencyId: string, groupId: string) {
    await this.db
      .delete(travelGroups)
      .where(
        and(eq(travelGroups.agencyId, agencyId), eq(travelGroups.id, groupId)),
      )
  }

  async getGroupDeleteBlockers(agencyId: string, groupId: string) {
    const [groupRow] = await this.db
      .select({ id: travelGroups.id })
      .from(travelGroups)
      .where(
        and(eq(travelGroups.agencyId, agencyId), eq(travelGroups.id, groupId)),
      )
      .limit(1)

    const [bookingRow] = await this.db
      .select({ total: count() })
      .from(bookings)
      .where(and(eq(bookings.agencyId, agencyId), eq(bookings.groupId, groupId)))

    const bookingCount = bookingRow?.total ?? 0
    const blockers =
      bookingCount > 0
        ? [`${bookingCount} booking${bookingCount === 1 ? "" : "s"}`]
        : []

    return {
      exists: Boolean(groupRow),
      blockers,
    }
  }
}

export function createGroupRepository(db: MeridianDb) {
  return new GroupRepository(db)
}

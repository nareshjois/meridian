import { describe, expect, it } from "vitest"

import { PERMISSION_KEYS } from "@/shared/permissions"
import { createMeridianServices } from "@/server/services/registry"
import {
  adminContext,
  createTestDb,
  loginAsAdmin,
  seedTestAgency,
} from "@/server/services/users/test-helpers"

describe("customer service", () => {
  it("creates, lists, updates, and filters customers", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { customers } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const created = await customers.createCustomer(ctx, {
      displayName: "Jane Traveler",
      email: "jane@example.com",
      phoneCountryCode: "+1",
      phone: "555-0100",
      city: "Mumbai",
      state: "Maharashtra",
      countryCode: "IN",
      passportNumber: "P1234567",
    })
    expect(created.ok).toBe(true)

    const list = await customers.listCustomers(ctx, {
      page: 1,
      pageSize: 25,
      sortDirection: "asc",
      search: "Jane",
    })
    expect(list.ok).toBe(true)
    if (list.ok) {
      expect(list.data.items.some((item) => item.displayName === "Jane Traveler")).toBe(
        true,
      )
    }

    if (!created.ok) {
      return
    }

    const updated = await customers.updateCustomer(ctx, created.data.id, {
      status: "inactive",
    })
    expect(updated.ok).toBe(true)
    if (updated.ok) {
      expect(updated.data.status).toBe("inactive")
    }
  })

  it("enforces customers.read permission", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { customers } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const result = await customers.listCustomers(
      { ...ctx, permissions: [] },
      { page: 1, pageSize: 25, sortDirection: "asc" },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN")
    }
  })

  it("deletes customers without commercial links", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { customers } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const created = await customers.createCustomer(ctx, {
      displayName: "Delete Me",
    })
    expect(created.ok).toBe(true)
    if (!created.ok) {
      return
    }

    const deleted = await customers.deleteCustomer(ctx, created.data.id)
    expect(deleted.ok).toBe(true)

    const fetched = await customers.getCustomerById(ctx, created.data.id)
    expect(fetched.ok).toBe(false)
    if (!fetched.ok) {
      expect(fetched.error.code).toBe("NOT_FOUND")
    }
  })
})

describe("customer family service", () => {
  it("manages family members", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { customers, customerFamilies } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const customer = await customers.createCustomer(ctx, {
      displayName: "Alex Smith",
    })
    expect(customer.ok).toBe(true)
    if (!customer.ok) {
      return
    }

    const family = await customerFamilies.createFamily(ctx, { name: "Smith family" })
    expect(family.ok).toBe(true)
    if (!family.ok) {
      return
    }

    const member = await customerFamilies.addMember(ctx, {
      familyId: family.data.id,
      customerId: customer.data.id,
      role: "head",
    })
    expect(member.ok).toBe(true)

    const members = await customerFamilies.listMembers(ctx, family.data.id)
    expect(members.ok).toBe(true)
    if (members.ok) {
      expect(members.data).toHaveLength(1)
    }

    const removed = await customerFamilies.removeMember(ctx, {
      familyId: family.data.id,
      customerId: customer.data.id,
    })
    expect(removed.ok).toBe(true)

    const deleted = await customerFamilies.deleteFamily(ctx, family.data.id)
    expect(deleted.ok).toBe(true)

    const families = await customerFamilies.listFamilies(ctx, {})
    expect(families.ok).toBe(true)
    if (families.ok) {
      expect(families.data.items.some((item) => item.id === family.data.id)).toBe(
        false,
      )
    }
  })
})

describe("group service", () => {
  it("creates groups and assigns members", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { customers, groups } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const ctx = adminContext(session)

    const customer = await customers.createCustomer(ctx, {
      displayName: "Group Guest",
    })
    expect(customer.ok).toBe(true)
    if (!customer.ok) {
      return
    }

    const group = await groups.createGroup(ctx, { name: "Spring tour" })
    expect(group.ok).toBe(true)
    if (!group.ok) {
      return
    }

    const member = await groups.addMember(ctx, {
      groupId: group.data.id,
      customerId: customer.data.id,
      role: "lead",
    })
    expect(member.ok).toBe(true)

    const list = await groups.listGroups(ctx, { search: "Spring" })
    expect(list.ok).toBe(true)
    if (list.ok) {
      expect(list.data.items.some((item) => item.name === "Spring tour")).toBe(true)
    }

    expect(session.user.permissionKeys).toContain(PERMISSION_KEYS["groups.read"])

    const deleted = await groups.deleteGroup(ctx, group.data.id)
    expect(deleted.ok).toBe(true)

    const afterDelete = await groups.listGroups(ctx, { search: "Spring" })
    expect(afterDelete.ok).toBe(true)
    if (afterDelete.ok) {
      expect(afterDelete.data.items.some((item) => item.id === group.data.id)).toBe(
        false,
      )
    }
  })
})

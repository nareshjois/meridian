import { describe, expect, it } from "vitest"

import { PERMISSION_KEYS } from "@/shared/permissions"

import { verifyPassword, hashPassword } from "./crypto"
import {
  adminContext,
  createTestDb,
  loginAsAdmin,
  seedTestAgency,
} from "./test-helpers"
import { createMeridianServices } from "./index"
import type { RoleSummary } from "./repository"

describe("user management service", () => {
  it("seeds default roles with expected permission bundles", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    await seedTestAgency(db)
    const { users } = createMeridianServices(db)
    const session = await loginAsAdmin(db)
    const roles: RoleSummary[] = await users.listRolesForAgency(session.user.agencyId)

    expect(roles.map((role) => role.key).sort()).toEqual([
      "admin",
      "staff",
      "viewer",
    ])
    expect(session.user.permissionKeys).toContain(PERMISSION_KEYS["users.read"])
    expect(session.user.permissionKeys).toContain(
      PERMISSION_KEYS["users.manage_roles"],
    )
  })

  it("invites, activates, and lists users", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { users } = createMeridianServices(db)
    const adminSession = await loginAsAdmin(db)
    const ctx = adminContext(adminSession)
    const roles = await users.listRolesForAgency(adminSession.user.agencyId)
    const staffRole = roles.find((role) => role.key === "staff")
    expect(staffRole).toBeDefined()

    const invite = await users.inviteUser(ctx, {
      email: "agent@meridian.example",
      roleId: staffRole!.id,
    })
    expect(invite.ok).toBe(true)
    if (!invite.ok) {
      return
    }

    const token = invite.data.activationUrl.split("token=")[1]
    expect(token).toBeTruthy()

    const activation = await users.activateInvite({
      token: token!,
      displayName: "Field Agent",
      password: "welcome-team",
    })
    expect(activation.ok).toBe(true)

    const list = await users.listUsers(ctx, { status: "active" })
    expect(list.ok).toBe(true)
    if (list.ok) {
      expect(list.data.items.some((user) => user.email === "agent@meridian.example")).toBe(
        true,
      )
    }
  })

  it("enforces permission checks and self-deactivation guard", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { users } = createMeridianServices(db)
    const adminSession = await loginAsAdmin(db)
    const ctx = adminContext(adminSession)

    const forbiddenList = await users.listUsers(
      {
        ...ctx,
        permissions: [],
      },
      {},
    )
    expect(forbiddenList.ok).toBe(false)

    const selfDeactivate = await users.setUserStatus(ctx, {
      userId: adminSession.user.id,
      status: "inactive",
    })
    expect(selfDeactivate.ok).toBe(false)
    if (!selfDeactivate.ok) {
      expect(selfDeactivate.error.code).toBe("INVARIANT_VIOLATION")
    }
  })

  it("assigns and removes roles for agency users", async () => {
    const db = createTestDb()
    await seedTestAgency(db)
    const { users } = createMeridianServices(db)
    const adminSession = await loginAsAdmin(db)
    const ctx = adminContext(adminSession)
    const roles = await users.listRolesForAgency(adminSession.user.agencyId)
    const viewerRole = roles.find((role) => role.key === "viewer")
    expect(viewerRole).toBeDefined()

    const invite = await users.inviteUser(ctx, {
      email: "viewer@meridian.example",
      roleId: viewerRole!.id,
    })
    expect(invite.ok).toBe(true)
    if (!invite.ok) {
      return
    }

    const token = invite.data.activationUrl.split("token=")[1]!
    const activation = await users.activateInvite({
      token,
      displayName: "Read Only",
      password: "read-only-1",
    })
    expect(activation.ok).toBe(true)
    if (!activation.ok) {
      return
    }

    const userId = activation.data.user.id
    const staffRole = roles.find((role) => role.key === "staff")
    expect(staffRole).toBeDefined()

    const assign = await users.assignRole(ctx, {
      userId,
      roleId: staffRole!.id,
    })
    expect(assign.ok).toBe(true)

    const detail = await users.getUserById(ctx, userId)
    expect(detail.ok).toBe(true)
    if (detail.ok) {
      expect(detail.data.roleIds).toContain(staffRole!.id)
    }

    const remove = await users.removeRole(ctx, {
      userId,
      roleId: viewerRole!.id,
    })
    expect(remove.ok).toBe(true)
  })
})

describe("auth crypto", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("secret-password")
    expect(verifyPassword("secret-password", hash)).toBe(true)
    expect(verifyPassword("wrong-password", hash)).toBe(false)
  })
})

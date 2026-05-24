import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  like,
  or,
} from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import {
  agencies,
  permissions,
  rolePermissions,
  roles,
  userInvites,
  userRoles,
  userSessions,
  users,
} from "@/server/db/schema/auth"
import type { PermissionKey } from "@/shared/permissions"

import { hashToken } from "./crypto"

export type UserStatus = "invited" | "active" | "inactive"

export type UserSummary = {
  id: string
  email: string
  displayName: string
  status: UserStatus
}

export type UserDetail = UserSummary & {
  roleIds: string[]
}

export type RoleSummary = {
  id: string
  key: string
  name: string
  description: string | null
}

export class UserRepository {
  constructor(private readonly db: MeridianDb) {}

  async findUsersByEmail(email: string) {
    return this.db.select().from(users).where(eq(users.email, email))
  }

  async findUserByAgencyEmail(agencyId: string, email: string) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.agencyId, agencyId), eq(users.email, email)))
      .limit(1)

    return row ?? null
  }

  async findUserById(agencyId: string, userId: string) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.agencyId, agencyId), eq(users.id, userId)))
      .limit(1)

    return row ?? null
  }

  async listUsers(
    agencyId: string,
    query: { search?: string; status?: UserStatus },
  ) {
    const filters = [eq(users.agencyId, agencyId)]

    if (query.status) {
      filters.push(eq(users.status, query.status))
    }

    if (query.search) {
      const pattern = `%${query.search.trim()}%`
      filters.push(
        or(
          like(users.email, pattern),
          like(users.displayName, pattern),
        )!,
      )
    }

    const whereClause = and(...filters)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(users)
      .where(whereClause)

    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))

    return {
      items: rows as UserSummary[],
      total: totalRow?.total ?? 0,
    }
  }

  async getUserDetail(agencyId: string, userId: string): Promise<UserDetail | null> {
    const user = await this.findUserById(agencyId, userId)
    if (!user) {
      return null
    }

    const roleRows = await this.db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roleIds: roleRows.map((row) => row.roleId),
    }
  }

  async listRoles(agencyId: string): Promise<RoleSummary[]> {
    return this.db
      .select({
        id: roles.id,
        key: roles.key,
        name: roles.name,
        description: roles.description,
      })
      .from(roles)
      .where(eq(roles.agencyId, agencyId))
      .orderBy(roles.name)
  }

  async findRoleById(agencyId: string, roleId: string) {
    const [row] = await this.db
      .select()
      .from(roles)
      .where(and(eq(roles.agencyId, agencyId), eq(roles.id, roleId)))
      .limit(1)

    return row ?? null
  }

  async createInvite(input: {
    agencyId: string
    email: string
    invitedByUserId: string
    roleId: string
    token: string
    expiresAt: Date
  }) {
    const id = crypto.randomUUID()

    await this.db.insert(userInvites).values({
      id,
      agencyId: input.agencyId,
      email: input.email,
      invitedByUserId: input.invitedByUserId,
      roleId: input.roleId,
      tokenHash: hashToken(input.token),
      expiresAt: input.expiresAt,
    })

    return { id, token: input.token }
  }

  async deletePendingInvites(agencyId: string, email: string) {
    await this.db
      .delete(userInvites)
      .where(
        and(
          eq(userInvites.agencyId, agencyId),
          eq(userInvites.email, email),
          isNull(userInvites.acceptedAt),
        ),
      )
  }

  async findInviteByToken(token: string) {
    const [row] = await this.db
      .select()
      .from(userInvites)
      .where(eq(userInvites.tokenHash, hashToken(token)))
      .limit(1)

    return row ?? null
  }

  async markInviteAccepted(inviteId: string, acceptedAt: Date) {
    await this.db
      .update(userInvites)
      .set({ acceptedAt, updatedAt: acceptedAt })
      .where(eq(userInvites.id, inviteId))
  }

  async createUser(input: {
    agencyId: string
    email: string
    displayName: string
    passwordHash?: string | null
    status: UserStatus
  }) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(users).values({
      id,
      agencyId: input.agencyId,
      email: input.email,
      displayName: input.displayName,
      passwordHash: input.passwordHash ?? null,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    })

    return id
  }

  async updateUser(
    userId: string,
    input: Partial<{
      displayName: string
      passwordHash: string
      status: UserStatus
      lastLoginAt: Date
    }>,
  ) {
    await this.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }

  async assignRole(userId: string, roleId: string) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db
      .insert(userRoles)
      .values({
        id,
        userId,
        roleId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
  }

  async removeRole(userId: string, roleId: string) {
    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
  }

  async createSession(input: {
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(userSessions).values({
      id,
      userId: input.userId,
      tokenHash: hashToken(input.token),
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: now,
      updatedAt: now,
    })

    return id
  }

  async findSessionById(sessionId: string) {
    const [row] = await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1)

    return row ?? null
  }

  async revokeSession(sessionId: string) {
    const now = new Date()
    await this.db
      .update(userSessions)
      .set({ revokedAt: now, updatedAt: now })
      .where(eq(userSessions.id, sessionId))
  }

  async revokeUserSessions(userId: string) {
    const now = new Date()
    await this.db
      .update(userSessions)
      .set({ revokedAt: now, updatedAt: now })
      .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)))
  }

  async seedPermissions(allKeys: readonly PermissionKey[]) {
    const existing = await this.db.select({ key: permissions.key }).from(permissions)
    const existingKeys = new Set(existing.map((row) => row.key))
    const now = new Date()

    const missing = allKeys.filter((key) => !existingKeys.has(key))
    if (missing.length === 0) {
      return
    }

    await this.db.insert(permissions).values(
      missing.map((key) => ({
        id: crypto.randomUUID(),
        key,
        module: key.split(".")[0] ?? "core",
        createdAt: now,
        updatedAt: now,
      })),
    )
  }

  async seedAgencyDefaults(input: {
    agencyId: string
    agencyName: string
    agencySlug: string
    adminEmail: string
    adminDisplayName: string
    adminPasswordHash: string
    allPermissionKeys: readonly PermissionKey[]
    readPermissionKeys: readonly PermissionKey[]
    staffPermissionKeys: readonly PermissionKey[]
  }) {
    const now = new Date()

    await this.db
      .insert(agencies)
      .values({
        id: input.agencyId,
        name: input.agencyName,
        slug: input.agencySlug,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()

    await this.seedPermissions(input.allPermissionKeys)

    const permissionRows = await this.db
      .select({ id: permissions.id, key: permissions.key })
      .from(permissions)

    const permissionIdByKey = new Map(
      permissionRows.map((row) => [row.key, row.id]),
    )

    const roleDefinitions = [
      {
        key: "admin",
        name: "Administrator",
        description: "Full workspace access including user and role management.",
        permissionKeys: input.allPermissionKeys,
      },
      {
        key: "staff",
        name: "Staff",
        description: "Day-to-day operations without user administration.",
        permissionKeys: input.staffPermissionKeys,
      },
      {
        key: "viewer",
        name: "Viewer",
        description: "Read-only access across operational modules.",
        permissionKeys: input.readPermissionKeys,
      },
    ] as const

    const roleIdByKey = new Map<string, string>()

    for (const role of roleDefinitions) {
      const roleId = await this.ensureAgencyRole({
        agencyId: input.agencyId,
        key: role.key,
        name: role.name,
        description: role.description,
        now,
      })
      roleIdByKey.set(role.key, roleId)

      const permissionIds = role.permissionKeys
        .map((key) => permissionIdByKey.get(key))
        .filter((value): value is string => Boolean(value))

      await this.ensureRolePermissions(roleId, permissionIds, now)
    }

    const adminRoleId = roleIdByKey.get("admin")
    if (!adminRoleId) {
      throw new Error("Failed to seed admin role")
    }

    const existingAdmin = await this.findUserByAgencyEmail(
      input.agencyId,
      input.adminEmail,
    )

    if (existingAdmin) {
      await this.assignRole(existingAdmin.id, adminRoleId)
      return existingAdmin.id
    }

    const adminUserId = crypto.randomUUID()
    await this.db.insert(users).values({
      id: adminUserId,
      agencyId: input.agencyId,
      email: input.adminEmail,
      displayName: input.adminDisplayName,
      passwordHash: input.adminPasswordHash,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })

    await this.assignRole(adminUserId, adminRoleId)

    return adminUserId
  }

  private async ensureAgencyRole(input: {
    agencyId: string
    key: string
    name: string
    description: string
    now: Date
  }) {
    const existing = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.agencyId, input.agencyId), eq(roles.key, input.key)))
      .limit(1)

    if (existing[0]) {
      return existing[0].id
    }

    const roleId = crypto.randomUUID()
    await this.db.insert(roles).values({
      id: roleId,
      agencyId: input.agencyId,
      key: input.key,
      name: input.name,
      description: input.description,
      createdAt: input.now,
      updatedAt: input.now,
    })

    return roleId
  }

  private async ensureRolePermissions(
    roleId: string,
    permissionIds: string[],
    now: Date,
  ) {
    if (permissionIds.length === 0) {
      return
    }

    const existing = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId))

    const existingPermissionIds = new Set(
      existing.map((row) => row.permissionId),
    )

    const missingPermissionIds = permissionIds.filter(
      (permissionId) => !existingPermissionIds.has(permissionId),
    )

    if (missingPermissionIds.length === 0) {
      return
    }

    await this.db.insert(rolePermissions).values(
      missingPermissionIds.map((permissionId) => ({
        id: crypto.randomUUID(),
        roleId,
        permissionId,
        createdAt: now,
        updatedAt: now,
      })),
    )
  }

  async getPermissionKeysForRoleIds(roleIds: string[]): Promise<PermissionKey[]> {
    if (roleIds.length === 0) {
      return []
    }

    const rows = await this.db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds))

    return [...new Set(rows.map((row) => row.key))] as PermissionKey[]
  }
}

export function createUserRepository(db: MeridianDb) {
  return new UserRepository(db)
}

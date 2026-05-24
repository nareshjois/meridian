import { eq, inArray } from "drizzle-orm"

import type { PermissionKey } from "@/shared/permissions"
import { PERMISSION_KEYS } from "@/shared/permissions"
import type { MeridianDb } from "@/server/db/client"
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "@/server/db/schema/auth"

export async function resolveUserPermissionKeys(
  db: MeridianDb,
  userId: string,
): Promise<PermissionKey[]> {
  const roleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))

  if (roleRows.length === 0) {
    return []
  }

  const permissionRows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      inArray(
        rolePermissions.roleId,
        roleRows.map((row) => row.roleId),
      ),
    )

  const uniqueKeys = [...new Set(permissionRows.map((row) => row.key))]
  return uniqueKeys as PermissionKey[]
}

export async function resolveUserRoleKeys(
  db: MeridianDb,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  return rows.map((row) => row.key)
}

export function permissionForUserList(): PermissionKey {
  return PERMISSION_KEYS["users.read"]
}

export function permissionForUserWrite(): PermissionKey {
  return PERMISSION_KEYS["users.write"]
}

export function permissionForUserInvite(): PermissionKey {
  return PERMISSION_KEYS["users.invite"]
}

export function permissionForManageRoles(): PermissionKey {
  return PERMISSION_KEYS["users.manage_roles"]
}

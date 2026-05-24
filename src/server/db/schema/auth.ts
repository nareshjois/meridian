import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import {
  agencyIdColumn,
  idColumn,
  timestampColumns,
  uuidDefault,
} from "./_common"

export const agencies = sqliteTable("agencies", {
  id: idColumn(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...timestampColumns,
})

export const users = sqliteTable(
  "users",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash"),
    status: text("status", {
      enum: ["invited", "active", "inactive"],
    })
      .notNull()
      .default("invited"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("users_agency_email_uidx").on(table.agencyId, table.email),
    index("users_agency_status_idx").on(table.agencyId, table.status),
  ],
)

export const roles = sqliteTable(
  "roles",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("roles_agency_key_uidx").on(table.agencyId, table.key),
  ],
)

export const permissions = sqliteTable(
  "permissions",
  {
    id: idColumn(),
    key: text("key").notNull(),
    description: text("description"),
    module: text("module").notNull(),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("permissions_key_uidx").on(table.key)],
)

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    id: idColumn(),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("role_permissions_role_permission_uidx").on(
      table.roleId,
      table.permissionId,
    ),
  ],
)

export const userRoles = sqliteTable(
  "user_roles",
  {
    id: idColumn(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("user_roles_user_role_uidx").on(table.userId, table.roleId),
  ],
)

export const userInvites = sqliteTable(
  "user_invites",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    email: text("email").notNull(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => users.id),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    index("user_invites_agency_email_idx").on(table.agencyId, table.email),
    uniqueIndex("user_invites_token_hash_uidx").on(table.tokenHash),
  ],
)

export const userSessions = sqliteTable(
  "user_sessions",
  {
    id: idColumn(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("user_sessions_token_hash_uidx").on(table.tokenHash),
    index("user_sessions_user_id_idx").on(table.userId),
  ],
)

export type Agency = typeof agencies.$inferSelect
export type User = typeof users.$inferSelect
export type Role = typeof roles.$inferSelect
export type Permission = typeof permissions.$inferSelect
export type RolePermission = typeof rolePermissions.$inferSelect
export type UserRole = typeof userRoles.$inferSelect
export type UserInvite = typeof userInvites.$inferSelect
export type UserSession = typeof userSessions.$inferSelect

export const authTables = {
  agencies,
  users,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  userInvites,
  userSessions,
} as const

/** Contract note: downstream teams seed permissions from shared permission keys. */
export const authTableNames = Object.keys(authTables) as Array<
  keyof typeof authTables
>

export { uuidDefault }

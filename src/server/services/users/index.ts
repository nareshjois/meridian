import { ALL_PERMISSION_KEYS, PERMISSION_KEYS } from "@/shared/permissions"
import type { PermissionKey } from "@/shared/permissions"
import type { MeridianDb } from "@/server/db/client"
import type { MeridianServices } from "@/server/services"

import { createAuthService } from "./auth.service"
import { hashPassword } from "./crypto"
import { createUserRepository } from "./repository"
import { createUserService } from "./user.service"
import type { UserService } from "./user.service"

const READ_PERMISSION_KEYS = ALL_PERMISSION_KEYS.filter((key) =>
  key.endsWith(".read"),
) as PermissionKey[]

const STAFF_PERMISSION_KEYS = ALL_PERMISSION_KEYS.filter(
  (key) =>
    key !== PERMISSION_KEYS["users.manage_roles"] &&
    key !== PERMISSION_KEYS["users.invite"] &&
    key !== PERMISSION_KEYS["users.write"] &&
    key !== PERMISSION_KEYS["accounting.journals.post"] &&
    key !== PERMISSION_KEYS["accounting.journals.reverse"],
) as PermissionKey[]

import { DEV_ADMIN_CREDENTIALS } from "@/shared/dev/credentials"

export const DEFAULT_DEV_AGENCY = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Meridian Demo Agency",
  slug: "meridian-demo",
} as const

export const DEFAULT_DEV_ADMIN = DEV_ADMIN_CREDENTIALS

export async function ensureDevSeed(db: MeridianDb) {
  const repo = createUserRepository(db)

  await repo.seedAgencyDefaults({
    agencyId: DEFAULT_DEV_AGENCY.id,
    agencyName: DEFAULT_DEV_AGENCY.name,
    agencySlug: DEFAULT_DEV_AGENCY.slug,
    adminEmail: DEFAULT_DEV_ADMIN.email,
    adminDisplayName: DEFAULT_DEV_ADMIN.displayName,
    adminPasswordHash: hashPassword(DEFAULT_DEV_ADMIN.password),
    allPermissionKeys: ALL_PERMISSION_KEYS,
    readPermissionKeys: READ_PERMISSION_KEYS,
    staffPermissionKeys: STAFF_PERMISSION_KEYS,
  })
}

export function createMeridianServices(db: MeridianDb): Pick<
  MeridianServices,
  "auth" | "users"
> & { users: UserService } {
  return {
    auth: createAuthService(db),
    users: createUserService(db),
  }
}

export type { UserService } from "./user.service"

export {
  READ_PERMISSION_KEYS,
  STAFF_PERMISSION_KEYS,
}

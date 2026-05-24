import { ALL_PERMISSION_KEYS, PERMISSION_KEYS } from "@/shared/permissions"
import type { PermissionKey } from "@/shared/permissions"
import type { MeridianDb } from "@/server/db/client"
import { ensureAccountingSeed } from "@/server/services/accounting/seed"
import { ensureCommercialSeed } from "@/server/services/commercial/seed"

import { hashPassword } from "./crypto"
import { createUserRepository } from "./repository"

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

  await ensureCommercialSeed(db, DEFAULT_DEV_AGENCY.id)
  await ensureAccountingSeed(db, DEFAULT_DEV_AGENCY.id)
}

export { createMeridianServices } from "@/server/services/registry"

export type { UserService } from "./user.service"

export {
  READ_PERMISSION_KEYS,
  STAFF_PERMISSION_KEYS,
}

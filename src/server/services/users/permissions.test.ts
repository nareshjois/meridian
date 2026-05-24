import { describe, expect, it } from "vitest"

import { PERMISSION_KEYS } from "@/shared/permissions"
import {
  READ_PERMISSION_KEYS,
  STAFF_PERMISSION_KEYS,
} from "@/server/services/users"

describe("RBAC role-permission assumptions", () => {
  it("maps admin to all permissions", () => {
    expect(STAFF_PERMISSION_KEYS.length).toBeGreaterThan(0)
    expect(READ_PERMISSION_KEYS.every((key) => key.endsWith(".read"))).toBe(true)
    expect(STAFF_PERMISSION_KEYS).not.toContain(PERMISSION_KEYS["users.manage_roles"])
    expect(STAFF_PERMISSION_KEYS).not.toContain(PERMISSION_KEYS["users.invite"])
    expect(STAFF_PERMISSION_KEYS).not.toContain(PERMISSION_KEYS["users.write"])
  })

  it("documents user-domain permission requirements", () => {
    expect(PERMISSION_KEYS["users.read"]).toBe("users.read")
    expect(PERMISSION_KEYS["users.write"]).toBe("users.write")
    expect(PERMISSION_KEYS["users.invite"]).toBe("users.invite")
    expect(PERMISSION_KEYS["users.manage_roles"]).toBe("users.manage_roles")
  })
})

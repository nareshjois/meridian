import { redirect } from "@tanstack/react-router"

import type { PermissionKey } from "@/shared/permissions"
import { assertPermission } from "@/shared/permissions"
import type { AppRouteContext } from "@/shared/routes/contracts"
import type { SessionDto } from "@/shared/validation/dtos/auth"

import { resolveSession } from "./session"

export class UnauthenticatedError extends Error {
  readonly code = "UNAUTHENTICATED" as const

  constructor() {
    super("Authentication required")
    this.name = "UnauthenticatedError"
  }
}

export type GuardOptions = {
  redirectTo?: string
  redirectSearch?: Record<string, string | undefined>
  requiredPermissions?: readonly PermissionKey[]
}

export async function requireSession(
  options: GuardOptions = {},
): Promise<SessionDto> {
  const session = await resolveSession()

  if (!session) {
    throw redirect({
      to: options.redirectTo ?? "/auth/login",
      search: options.redirectSearch,
    })
  }

  if (options.requiredPermissions?.length) {
    for (const permission of options.requiredPermissions) {
      assertPermission(session.user.permissionKeys, permission)
    }
  }

  return session
}

export async function createAppRouteContext(
  options: GuardOptions = {},
): Promise<AppRouteContext> {
  const session = await requireSession(options)

  return {
    session,
    permissions: session.user.permissionKeys as PermissionKey[],
  }
}

export function getRedirectSearch(currentHref: string) {
  try {
    const pathname = new URL(currentHref, "http://localhost").pathname
    return { redirect: pathname.startsWith("/") ? pathname : "/app" }
  } catch {
    return { redirect: "/app" }
  }
}

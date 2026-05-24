import type { PermissionKey } from "@/shared/permissions"
import type { SessionDto } from "@/shared/validation/dtos/auth"

/**
 * Session resolution contract.
 * Workstream 2 (auth/users) implements persistence against `user_sessions`.
 */
export type SessionResolver = () => Promise<SessionDto | null>

let sessionResolver: SessionResolver = async () => null

export function registerSessionResolver(resolver: SessionResolver) {
  sessionResolver = resolver
}

export async function resolveSession(): Promise<SessionDto | null> {
  return sessionResolver()
}

export function createServiceContext(session: SessionDto) {
  return {
    agencyId: session.user.agencyId,
    actorUserId: session.user.id,
    permissions: session.user.permissionKeys as PermissionKey[],
    session,
  } as const
}

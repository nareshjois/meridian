import { eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { users, userSessions } from "@/server/db/schema/auth"
import type { AuthServiceContract } from "@/server/services/auth.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
  type VoidMutationResult,
} from "@/server/services/_types"
import type { LoginInput, SessionDto, SessionUserDto } from "@/shared/validation/dtos/auth"

import { SESSION_TTL_MS } from "./constants"
import { generateToken, verifyPassword } from "./crypto"
import {
  resolveUserPermissionKeys,
  resolveUserRoleKeys,
} from "./permissions"
import { createUserRepository } from "./repository"

export function createAuthService(db: MeridianDb): AuthServiceContract {
  const repo = createUserRepository(db)

  async function buildSessionDto(
    sessionId: string,
    userId: string,
    expiresAt: Date,
  ): Promise<ServiceResult<SessionDto>> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user) {
      return serviceErr({
        code: "NOT_FOUND",
        message: "User not found for session.",
      })
    }

    const [roleKeys, permissionKeys] = await Promise.all([
      resolveUserRoleKeys(db, user.id),
      resolveUserPermissionKeys(db, user.id),
    ])

    const sessionUser: SessionUserDto = {
      id: user.id,
      agencyId: user.agencyId,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roleKeys,
      permissionKeys,
    }

    return serviceOk({
      sessionId,
      user: sessionUser,
      expiresAt,
    })
  }

  return {
    async login(input: LoginInput) {
      const email = input.email.trim().toLowerCase()
      const matches = await repo.findUsersByEmail(email)

      if (matches.length === 0) {
        return serviceErr({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        })
      }

      if (matches.length > 1) {
        return serviceErr({
          code: "CONFLICT",
          message:
            "This email belongs to multiple agencies. Contact your administrator.",
        })
      }

      const user = matches[0]!

      if (user.status !== "active") {
        return serviceErr({
          code: "FORBIDDEN",
          message: "This account is not active.",
        })
      }

      if (!user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        return serviceErr({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        })
      }

      const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
      const token = generateToken()
      const sessionId = await repo.createSession({
        userId: user.id,
        token,
        expiresAt,
      })

      await repo.updateUser(user.id, { lastLoginAt: new Date() })

      return buildSessionDto(sessionId, user.id, expiresAt)
    },

    async logout(sessionId: string): Promise<VoidMutationResult> {
      const session = await repo.findSessionById(sessionId)
      if (session) {
        await repo.revokeSession(sessionId)
      }

      return serviceOk({ success: true })
    },

    async getSession(sessionId: string) {
      const session = await repo.findSessionById(sessionId)
      if (!session) {
        return serviceOk(null)
      }

      if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
        return serviceOk(null)
      }

      return buildSessionDto(sessionId, session.userId, session.expiresAt)
    },

    async refreshSession(sessionId: string) {
      const session = await repo.findSessionById(sessionId)
      if (!session || session.revokedAt) {
        return serviceErr({
          code: "UNAUTHORIZED",
          message: "Session is no longer valid.",
        })
      }

      const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
      await db
        .update(userSessions)
        .set({ expiresAt, updatedAt: new Date() })
        .where(eq(userSessions.id, sessionId))

      return buildSessionDto(sessionId, session.userId, expiresAt)
    },
  }
}

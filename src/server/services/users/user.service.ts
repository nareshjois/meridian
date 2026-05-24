import type { MeridianDb } from "@/server/db/client"
import type { UserServiceContract } from "@/server/services/auth.contract"
import {
  serviceErr,
  serviceOk,
  type ServiceResult,
} from "@/server/services/_types"
import { hasPermission } from "@/shared/permissions"
import type { ActivateInviteInput } from "@/shared/validation/dtos/auth"

import { INVITE_TTL_MS, SESSION_TTL_MS } from "./constants"
import { createAuthService } from "./auth.service"
import { generateToken, hashPassword, verifyPassword } from "./crypto"
import {
  permissionForManageRoles,
  permissionForUserInvite,
  permissionForUserList,
  permissionForUserWrite,
} from "./permissions"
import { createUserRepository } from "./repository"

function forbidden<T>(message: string): ServiceResult<T> {
  return serviceErr({ code: "FORBIDDEN", message })
}

export function createUserService(db: MeridianDb): UserServiceContract & {
  listRolesForAgency: (agencyId: string) => ReturnType<
    ReturnType<typeof createUserRepository>["listRoles"]
  >
} {
  const repo = createUserRepository(db)
  const auth = createAuthService(db)

  return {
    async listUsers(ctx, query) {
      if (!hasPermission(ctx.permissions, permissionForUserList())) {
        return forbidden("Missing permission to list users.")
      }

      const result = await repo.listUsers(ctx.agencyId, query)

      return serviceOk({
        items: result.items,
        page: 1,
        pageSize: Math.max(result.total, 1),
        total: result.total,
      })
    },

    async getUserById(ctx, userId) {
      if (!hasPermission(ctx.permissions, permissionForUserList())) {
        return forbidden("Missing permission to view users.")
      }

      const user = await repo.getUserDetail(ctx.agencyId, userId)
      if (!user) {
        return serviceErr({ code: "NOT_FOUND", message: "User not found." })
      }

      return serviceOk(user)
    },

    async inviteUser(ctx, input) {
      if (!hasPermission(ctx.permissions, permissionForUserInvite())) {
        return forbidden("Missing permission to invite users.")
      }

      const email = input.email.trim().toLowerCase()
      const role = await repo.findRoleById(ctx.agencyId, input.roleId)
      if (!role) {
        return serviceErr({ code: "NOT_FOUND", message: "Role not found." })
      }

      const existingUser = await repo.findUserByAgencyEmail(ctx.agencyId, email)
      if (existingUser && existingUser.status !== "invited") {
        return serviceErr({
          code: "CONFLICT",
          message: "A user with this email already exists.",
        })
      }

      await repo.deletePendingInvites(ctx.agencyId, email)

      if (!existingUser) {
        await repo.createUser({
          agencyId: ctx.agencyId,
          email,
          displayName: email.split("@")[0] ?? email,
          status: "invited",
        })
      }

      const token = generateToken()
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
      const invite = await repo.createInvite({
        agencyId: ctx.agencyId,
        email,
        invitedByUserId: ctx.actorUserId,
        roleId: input.roleId,
        token,
        expiresAt,
      })

      return serviceOk({
        inviteId: invite.id,
        activationUrl: `/auth/activate?token=${token}`,
      })
    },

    async activateInvite(input: ActivateInviteInput) {
      const invite = await repo.findInviteByToken(input.token)
      if (!invite) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Invite link is invalid or expired.",
        })
      }

      if (invite.acceptedAt) {
        return serviceErr({
          code: "CONFLICT",
          message: "This invite has already been used.",
        })
      }

      if (invite.expiresAt.getTime() <= Date.now()) {
        return serviceErr({
          code: "VALIDATION_ERROR",
          message: "Invite link has expired.",
        })
      }

      const user = await repo.findUserByAgencyEmail(invite.agencyId, invite.email)
      if (!user) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Invited user record was not found.",
        })
      }

      await repo.updateUser(user.id, {
        displayName: input.displayName.trim(),
        passwordHash: hashPassword(input.password),
        status: "active",
      })

      await repo.assignRole(user.id, invite.roleId)
      await repo.markInviteAccepted(invite.id, new Date())

      const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
      const sessionToken = generateToken()
      const sessionId = await repo.createSession({
        userId: user.id,
        token: sessionToken,
        expiresAt,
      })

      const session = await auth.getSession(sessionId)
      if (!session.ok || !session.data) {
        return serviceErr({
          code: "INTERNAL_ERROR",
          message: "Failed to create session after activation.",
        })
      }

      return serviceOk(session.data)
    },

    async setUserStatus(ctx, input) {
      if (!hasPermission(ctx.permissions, permissionForUserWrite())) {
        return forbidden("Missing permission to update users.")
      }

      if (ctx.actorUserId === input.userId) {
        return serviceErr({
          code: "INVARIANT_VIOLATION",
          message: "You cannot change your own account status.",
        })
      }

      const user = await repo.findUserById(ctx.agencyId, input.userId)
      if (!user) {
        return serviceErr({ code: "NOT_FOUND", message: "User not found." })
      }

      if (user.status === "invited") {
        return serviceErr({
          code: "VALIDATION_ERROR",
          message: "Invited users must activate their account first.",
        })
      }

      await repo.updateUser(user.id, { status: input.status })

      if (input.status === "inactive") {
        await repo.revokeUserSessions(user.id)
      }

      return serviceOk({ success: true })
    },

    async assignRole(ctx, input) {
      if (!hasPermission(ctx.permissions, permissionForManageRoles())) {
        return forbidden("Missing permission to manage roles.")
      }

      const user = await repo.findUserById(ctx.agencyId, input.userId)
      if (!user) {
        return serviceErr({ code: "NOT_FOUND", message: "User not found." })
      }

      const role = await repo.findRoleById(ctx.agencyId, input.roleId)
      if (!role) {
        return serviceErr({ code: "NOT_FOUND", message: "Role not found." })
      }

      const detail = await repo.getUserDetail(ctx.agencyId, input.userId)
      if (detail?.roleIds.includes(input.roleId)) {
        return serviceOk({ success: true })
      }

      await repo.assignRole(input.userId, input.roleId)
      return serviceOk({ success: true })
    },

    async removeRole(ctx, input) {
      if (!hasPermission(ctx.permissions, permissionForManageRoles())) {
        return forbidden("Missing permission to manage roles.")
      }

      const user = await repo.findUserById(ctx.agencyId, input.userId)
      if (!user) {
        return serviceErr({ code: "NOT_FOUND", message: "User not found." })
      }

      const role = await repo.findRoleById(ctx.agencyId, input.roleId)
      if (!role) {
        return serviceErr({ code: "NOT_FOUND", message: "Role not found." })
      }

      await repo.removeRole(input.userId, input.roleId)
      return serviceOk({ success: true })
    },

    async updateOwnProfile(ctx, input) {
      const user = await repo.findUserById(ctx.agencyId, ctx.actorUserId)
      if (!user) {
        return serviceErr({ code: "NOT_FOUND", message: "User not found." })
      }

      if (user.status !== "active") {
        return serviceErr({
          code: "FORBIDDEN",
          message: "Only active accounts can update their profile.",
        })
      }

      const displayName = input.displayName.trim()
      await repo.updateUser(user.id, { displayName })

      return serviceOk({
        id: user.id,
        email: user.email,
        displayName,
        status: user.status,
      })
    },

    async changeOwnPassword(ctx, input) {
      const user = await repo.findUserById(ctx.agencyId, ctx.actorUserId)
      if (!user) {
        return serviceErr({ code: "NOT_FOUND", message: "User not found." })
      }

      if (user.status !== "active") {
        return serviceErr({
          code: "FORBIDDEN",
          message: "Only active accounts can change their password.",
        })
      }

      if (!user.passwordHash || !verifyPassword(input.currentPassword, user.passwordHash)) {
        return serviceErr({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect.",
        })
      }

      await repo.updateUser(user.id, {
        passwordHash: hashPassword(input.newPassword),
      })

      return serviceOk({ success: true })
    },

    listRolesForAgency(agencyId: string) {
      return repo.listRoles(agencyId)
    },
  }
}

export type UserService = ReturnType<typeof createUserService>

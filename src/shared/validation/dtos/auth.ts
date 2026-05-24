import { z } from "zod"

import { emailSchema, idSchema, nonEmptyStringSchema } from "../common"

export const loginInputSchema = z.object({
  email: emailSchema,
  password: nonEmptyStringSchema,
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const sessionUserSchema = z.object({
  id: idSchema,
  agencyId: idSchema,
  email: emailSchema,
  displayName: nonEmptyStringSchema,
  status: z.enum(["invited", "active", "inactive"]),
  roleKeys: z.array(nonEmptyStringSchema),
  permissionKeys: z.array(nonEmptyStringSchema),
})
export type SessionUserDto = z.infer<typeof sessionUserSchema>

export const sessionSchema = z.object({
  sessionId: idSchema,
  user: sessionUserSchema,
  expiresAt: z.coerce.date(),
})
export type SessionDto = z.infer<typeof sessionSchema>

export const inviteUserInputSchema = z.object({
  email: emailSchema,
  roleId: idSchema,
})
export type InviteUserInput = z.infer<typeof inviteUserInputSchema>

export const activateInviteInputSchema = z.object({
  token: nonEmptyStringSchema,
  displayName: nonEmptyStringSchema,
  password: nonEmptyStringSchema.min(8),
})
export type ActivateInviteInput = z.infer<typeof activateInviteInputSchema>

export const assignRoleInputSchema = z.object({
  userId: idSchema,
  roleId: idSchema,
})
export type AssignRoleInput = z.infer<typeof assignRoleInputSchema>

export const setUserStatusInputSchema = z.object({
  userId: idSchema,
  status: z.enum(["active", "inactive"]),
})
export type SetUserStatusInput = z.infer<typeof setUserStatusInputSchema>

export const userListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["invited", "active", "inactive"]).optional(),
})
export type UserListQuery = z.infer<typeof userListQuerySchema>

export const activateSearchSchema = z.object({
  token: z.string().optional(),
})
export type ActivateSearchParams = z.infer<typeof activateSearchSchema>

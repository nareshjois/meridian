import { z } from "zod"

import {
  createListQuerySchema,
  emailSchema,
  idSchema,
  nonEmptyStringSchema,
} from "../common"

export const customerCreateInputSchema = z.object({
  displayName: nonEmptyStringSchema,
  email: emailSchema.optional(),
  phone: z.string().trim().optional(),
})
export type CustomerCreateInput = z.infer<typeof customerCreateInputSchema>

export const customerUpdateInputSchema = customerCreateInputSchema.partial().extend({
  status: z.enum(["active", "inactive"]).optional(),
})
export type CustomerUpdateInput = z.infer<typeof customerUpdateInputSchema>

export const customerListQuerySchema = createListQuerySchema({
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>

export const customerFamilyCreateInputSchema = z.object({
  name: nonEmptyStringSchema,
})
export type CustomerFamilyCreateInput = z.infer<
  typeof customerFamilyCreateInputSchema
>

export const customerFamilyMemberInputSchema = z.object({
  familyId: idSchema,
  customerId: idSchema,
  role: z.enum(["head", "spouse", "child", "other"]).default("other"),
})
export type CustomerFamilyMemberInput = z.infer<
  typeof customerFamilyMemberInputSchema
>

export const travelGroupCreateInputSchema = z.object({
  name: nonEmptyStringSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})
export type TravelGroupCreateInput = z.infer<typeof travelGroupCreateInputSchema>

export const groupMemberInputSchema = z.object({
  groupId: idSchema,
  customerId: idSchema,
  role: nonEmptyStringSchema.default("traveler"),
})
export type GroupMemberInput = z.infer<typeof groupMemberInputSchema>

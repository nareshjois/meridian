import { z } from "zod"

import {
  createListQuerySchema,
  emailSchema,
  idSchema,
  nonEmptyStringSchema,
} from "../common"

const optionalTrimmedStringSchema = z.string().trim().optional()

const countryCodeSchema = z
  .string()
  .trim()
  .length(2, "Country code must be ISO 3166-1 alpha-2")

const phoneCountryCodeSchema = z
  .string()
  .trim()
  .regex(/^\+\d{1,4}$/, "Dial code must start with + followed by digits")

const dateOfBirthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
  .optional()

export const customerProfileFieldsSchema = z.object({
  email: emailSchema.optional(),
  phoneCountryCode: phoneCountryCodeSchema.optional(),
  phone: optionalTrimmedStringSchema,
  address: optionalTrimmedStringSchema,
  city: optionalTrimmedStringSchema,
  state: optionalTrimmedStringSchema,
  countryCode: countryCodeSchema.optional(),
  dateOfBirth: dateOfBirthSchema,
  passportNumber: optionalTrimmedStringSchema,
})

export const customerCreateInputSchema = customerProfileFieldsSchema.extend({
  displayName: nonEmptyStringSchema,
})
export type CustomerCreateInput = z.infer<typeof customerCreateInputSchema>

export const customerUpdateInputSchema = customerCreateInputSchema
  .partial()
  .extend({
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

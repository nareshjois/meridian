import { z } from "zod"

import {
  createListQuerySchema,
  currencyCodeSchema,
  idSchema,
  moneyCentsSchema,
  nonEmptyStringSchema,
} from "../common"

export const vendorCreateInputSchema = z.object({
  name: nonEmptyStringSchema,
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  defaultExpenseAccountId: idSchema.optional(),
})
export type VendorCreateInput = z.infer<typeof vendorCreateInputSchema>

export const vendorBillItemInputSchema = z.object({
  description: nonEmptyStringSchema,
  quantity: z.number().int().min(1).default(1),
  unitCostCents: moneyCentsSchema,
  expenseAccountId: idSchema.optional(),
})
export type VendorBillItemInput = z.infer<typeof vendorBillItemInputSchema>

export const vendorBillCreateInputSchema = z.object({
  vendorId: idSchema,
  billNumber: nonEmptyStringSchema,
  currency: currencyCodeSchema.default("USD"),
  dueDate: z.coerce.date().optional(),
  items: z.array(vendorBillItemInputSchema).min(1),
})
export type VendorBillCreateInput = z.infer<typeof vendorBillCreateInputSchema>

export const vendorPaymentCreateInputSchema = z.object({
  vendorId: idSchema,
  vendorBillId: idSchema.optional(),
  amountCents: moneyCentsSchema.positive(),
  paidAt: z.coerce.date(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
})
export type VendorPaymentCreateInput = z.infer<
  typeof vendorPaymentCreateInputSchema
>

export const vendorListQuerySchema = createListQuerySchema({
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})
export type VendorListQuery = z.infer<typeof vendorListQuerySchema>

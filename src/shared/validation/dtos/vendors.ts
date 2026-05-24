import { z } from "zod"

import {
  createListQuerySchema,
  defaultCurrencyCodeSchema,
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

export const vendorUpdateInputSchema = z.object({
  name: nonEmptyStringSchema.optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  defaultExpenseAccountId: idSchema.optional().nullable(),
})
export type VendorUpdateInput = z.infer<typeof vendorUpdateInputSchema>

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
  currency: defaultCurrencyCodeSchema,
  dueDate: z.coerce.date().optional(),
  items: z.array(vendorBillItemInputSchema).min(1),
  /** When set with resolvable expense accounts, bill is posted (open) for payables. */
  payableAccountId: idSchema.optional(),
})
export type VendorBillCreateInput = z.infer<typeof vendorBillCreateInputSchema>

export const vendorBillListQuerySchema = createListQuerySchema({
  status: z
    .enum(["draft", "open", "partially_paid", "paid", "void"])
    .optional(),
})
export type VendorBillListQuery = z.infer<typeof vendorBillListQuerySchema>

export const vendorPaymentCreateInputSchema = z.object({
  vendorId: idSchema,
  vendorBillId: idSchema.optional(),
  amountCents: moneyCentsSchema.positive(),
  paidAt: z.coerce.date(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  cashAccountId: idSchema.optional(),
  payableAccountId: idSchema.optional(),
})
export type VendorPaymentCreateInput = z.infer<
  typeof vendorPaymentCreateInputSchema
>

export const vendorListQuerySchema = createListQuerySchema({
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})
export type VendorListQuery = z.infer<typeof vendorListQuerySchema>

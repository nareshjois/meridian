import { DEFAULT_CURRENCY } from "@/shared/currency"
import { z } from "zod"

export const idSchema = z.string().uuid()
export const agencyIdSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const nonEmptyStringSchema = z.string().trim().min(1)
export const currencyCodeSchema = z.string().length(3)
export const defaultCurrencyCodeSchema = currencyCodeSchema.default(DEFAULT_CURRENCY)
export const moneyCentsSchema = z.number().int()
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})
export const sortDirectionSchema = z.enum(["asc", "desc"])

export type PaginationInput = z.infer<typeof paginationSchema>
export type SortDirection = z.infer<typeof sortDirectionSchema>

export function createListQuerySchema<T extends z.ZodRawShape>(filters: T) {
  return paginationSchema.extend({
    sortBy: z.string().optional(),
    sortDirection: sortDirectionSchema.default("asc"),
    ...filters,
  })
}

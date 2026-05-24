import { z } from "zod"

import { idSchema, nonEmptyStringSchema } from "../common"

export const formTemplateCreateInputSchema = z.object({
  name: nonEmptyStringSchema,
  schemaJson: z.string().min(2),
})
export type FormTemplateCreateInput = z.infer<
  typeof formTemplateCreateInputSchema
>

export const formRequestCreateInputSchema = z.object({
  templateId: idSchema,
  customerId: idSchema.optional(),
  bookingId: idSchema.optional(),
  quoteId: idSchema.optional(),
  expiresAt: z.coerce.date(),
})
export type FormRequestCreateInput = z.infer<typeof formRequestCreateInputSchema>

export const formSubmissionInputSchema = z.object({
  token: nonEmptyStringSchema,
  payloadJson: z.string().min(2),
})
export type FormSubmissionInput = z.infer<typeof formSubmissionInputSchema>

export const formReviewInputSchema = z.object({
  submissionId: idSchema,
  reviewStatus: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
})
export type FormReviewInput = z.infer<typeof formReviewInputSchema>

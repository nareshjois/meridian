import type {
  MutationResult,
  ServiceContext,
  ServiceResult,
} from "./_types"
import type {
  FormRequestCreateInput,
  FormReviewInput,
  FormSubmissionInput,
  FormTemplateCreateInput,
} from "@/shared/validation/dtos/forms"
import type {
  FormRequest,
  FormSubmission,
  FormTemplate,
} from "@/server/db/schema/forms"

export interface FormServiceContract {
  createTemplate(
    ctx: ServiceContext,
    input: FormTemplateCreateInput,
  ): Promise<MutationResult<FormTemplate>>
  createRequest(
    ctx: ServiceContext,
    input: FormRequestCreateInput,
  ): Promise<MutationResult<{ request: FormRequest; publicUrl: string }>>
  submitByToken(
    input: FormSubmissionInput,
  ): Promise<MutationResult<FormSubmission>>
  reviewSubmission(
    ctx: ServiceContext,
    input: FormReviewInput,
  ): Promise<MutationResult<FormSubmission>>
  getSubmissionById(
    ctx: ServiceContext,
    submissionId: string,
  ): Promise<ServiceResult<FormSubmission>>
}

export type { FormServiceContract as FormService }

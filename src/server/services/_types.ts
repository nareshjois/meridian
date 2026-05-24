import type { PermissionKey } from "@/shared/permissions"
import type { SessionDto } from "@/shared/validation/dtos/auth"

export type ServiceErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVARIANT_VIOLATION"
  | "INTERNAL_ERROR"

export type ServiceError = {
  code: ServiceErrorCode
  message: string
  details?: unknown
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError }

export type ServiceContext = {
  agencyId: string
  actorUserId: string
  permissions: readonly PermissionKey[]
  session: SessionDto
}

export type PaginatedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type ListResult<T> = ServiceResult<PaginatedResult<T>>

export type MutationResult<T> = ServiceResult<T>

export type VoidMutationResult = ServiceResult<{ success: true }>

export function serviceOk<T>(data: T): ServiceResult<T> {
  return { ok: true, data }
}

export function serviceErr<T>(
  error: ServiceError,
): ServiceResult<T> {
  return { ok: false, error }
}

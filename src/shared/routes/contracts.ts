import type { PermissionKey } from "@/shared/permissions"
import type { SessionDto } from "@/shared/validation/dtos/auth"
import type { ServiceErrorCode } from "@/server/services/_types"

/** Serializable action error returned to route clients. */
export type RouteServiceError = {
  code: ServiceErrorCode
  message: string
}

/** Context injected by `/app` layout guard for all authenticated routes. */
export type AppRouteContext = {
  session: SessionDto
  permissions: readonly PermissionKey[]
}

/** Standard loader success envelope for `/app/*` routes. */
export type AppLoaderResult<TData> = {
  data: TData
}

/** Standard server action input envelope. */
export type RouteActionInput<TInput> = {
  data: TInput
}

/** Standard server action result envelope. */
export type RouteActionResult<TData = void> =
  | { ok: true; data: TData }
  | { ok: false; error: RouteServiceError }

export type AppRouteLoader<TData> = (args: {
  context: AppRouteContext
}) => Promise<AppLoaderResult<TData>>

export type AppRouteAction<TInput, TData = void> = (args: {
  context: AppRouteContext
  input: RouteActionInput<TInput>
}) => Promise<RouteActionResult<TData>>

/** Public route actions (no session), e.g. login and form submission. */
export type PublicRouteAction<TInput, TData = void> = (args: {
  input: RouteActionInput<TInput>
}) => Promise<RouteActionResult<TData>>

export type LoginSearchParams = {
  redirect?: string
}

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Optional permission keys required to enter a route. */
    requiredPermissions?: readonly PermissionKey[]
  }
}

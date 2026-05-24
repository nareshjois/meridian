import type { PermissionKey } from "./keys"

export function hasPermission(
  granted: readonly PermissionKey[] | readonly string[],
  required: PermissionKey,
): boolean {
  return granted.includes(required)
}

export function hasAnyPermission(
  granted: readonly PermissionKey[] | readonly string[],
  required: readonly PermissionKey[],
): boolean {
  return required.some((permission) => granted.includes(permission))
}

export function hasAllPermissions(
  granted: readonly PermissionKey[] | readonly string[],
  required: readonly PermissionKey[],
): boolean {
  return required.every((permission) => granted.includes(permission))
}

export class PermissionDeniedError extends Error {
  readonly code = "PERMISSION_DENIED" as const
  readonly required: PermissionKey

  constructor(required: PermissionKey) {
    super(`Missing required permission: ${required}`)
    this.name = "PermissionDeniedError"
    this.required = required
  }
}

export function assertPermission(
  granted: readonly PermissionKey[] | readonly string[],
  required: PermissionKey,
): void {
  if (!hasPermission(granted, required)) {
    throw new PermissionDeniedError(required)
  }
}

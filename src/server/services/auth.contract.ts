import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
  VoidMutationResult,
} from "./_types"
import type {
  ActivateInviteInput,
  AssignRoleInput,
  InviteUserInput,
  LoginInput,
  SessionDto,
} from "@/shared/validation/dtos/auth"

export interface AuthServiceContract {
  login(input: LoginInput): Promise<ServiceResult<SessionDto>>
  logout(sessionId: string): Promise<VoidMutationResult>
  getSession(sessionId: string): Promise<ServiceResult<SessionDto | null>>
  refreshSession(sessionId: string): Promise<ServiceResult<SessionDto>>
}

export interface UserServiceContract {
  listUsers(
    ctx: ServiceContext,
    query: { search?: string; status?: "invited" | "active" | "inactive" },
  ): Promise<ListResult<{
    id: string
    email: string
    displayName: string
    status: "invited" | "active" | "inactive"
  }>>
  getUserById(
    ctx: ServiceContext,
    userId: string,
  ): Promise<ServiceResult<{
    id: string
    email: string
    displayName: string
    status: "invited" | "active" | "inactive"
    roleIds: string[]
  }>>
  inviteUser(
    ctx: ServiceContext,
    input: InviteUserInput,
  ): Promise<MutationResult<{ inviteId: string; activationUrl: string }>>
  activateInvite(
    input: ActivateInviteInput,
  ): Promise<MutationResult<SessionDto>>
  setUserStatus(
    ctx: ServiceContext,
    input: { userId: string; status: "active" | "inactive" },
  ): Promise<VoidMutationResult>
  assignRole(
    ctx: ServiceContext,
    input: AssignRoleInput,
  ): Promise<VoidMutationResult>
  removeRole(
    ctx: ServiceContext,
    input: AssignRoleInput,
  ): Promise<VoidMutationResult>
}

export type { AuthServiceContract as AuthService }
export type { UserServiceContract as UserService }

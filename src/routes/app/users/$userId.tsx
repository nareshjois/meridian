import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { loadUserDetailFn } from "@/server/services/users/loaders"
import {
  assignRoleFn,
  removeRoleFn,
  setUserStatusFn,
} from "@/server/services/users/actions"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/users/$userId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["users.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["users.read"])
  },
  loader: async ({ params }) => {
    return loadUserDetailFn({ data: { userId: params.userId } })
  },
  component: UserDetailPage,
})

function UserDetailPage() {
  const router = useRouter()
  const { userId } = Route.useParams()
  const { session, permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState(
    data.roles.find((role) => !data.user.roleIds.includes(role.id))?.id ?? "",
  )

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["users.write"])
  const canManageRoles = hasPermission(
    permissions,
    PERMISSION_KEYS["users.manage_roles"],
  )
  const isSelf = session.user.id === data.user.id

  async function updateStatus(status: "active" | "inactive") {
    setMessage("")
    const result = await setUserStatusFn({ data: { userId, status } })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage(`User marked ${status}.`)
    await router.invalidate()
  }

  async function assignRole() {
    if (!selectedRoleId) {
      return
    }

    setMessage("")
    const result = await assignRoleFn({
      data: { userId, roleId: selectedRoleId },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage("Role assigned.")
    await router.invalidate()
  }

  async function removeRole(roleId: string) {
    setMessage("")
    const result = await removeRoleFn({ data: { userId, roleId } })
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage("Role removed.")
    await router.invalidate()
  }

  return (
    <section className="space-y-6">
      <div>
        <Link
          to="/app/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to team
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {data.user.displayName}
        </h1>
        <p className="text-sm text-muted-foreground">{data.user.email}</p>
        <p className="mt-1 text-sm capitalize">Status: {data.user.status}</p>
      </div>

      {canWrite && !isSelf && data.user.status !== "invited" ? (
        <div className="flex flex-wrap gap-3">
          {data.user.status === "active" ? (
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }))}
              onClick={() => updateStatus("inactive")}
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              className={cn(buttonVariants())}
              onClick={() => updateStatus("active")}
            >
              Activate
            </button>
          )}
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-medium">Roles</h2>
        <ul className="space-y-2 text-sm">
          {data.user.roleIds.length === 0 ? (
            <li className="text-muted-foreground">No roles assigned.</li>
          ) : (
            data.user.roleIds.map((roleId) => {
              const role = data.roles.find((item) => item.id === roleId)
              return (
                <li key={roleId} className="flex items-center justify-between">
                  <span>{role?.name ?? roleId}</span>
                  {canManageRoles ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => removeRole(roleId)}
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              )
            })
          )}
        </ul>

        {canManageRoles ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Select role</option>
              {data.roles
                .filter((role) => !data.user.roleIds.includes(role.id))
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              disabled={!selectedRoleId}
              className={cn(buttonVariants())}
              onClick={assignRole}
            >
              Assign role
            </button>
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  )
}

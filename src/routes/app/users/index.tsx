import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { loadUsersIndexFn } from "@/server/services/users/loaders"
import { inviteUserFn } from "@/server/services/users/actions"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { userListQuerySchema } from "@/shared/validation/dtos/auth"

export const Route = createFileRoute("/app/users/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["users.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    userListQuerySchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["users.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    return loadUsersIndexFn({ data: deps.search })
  },
  component: UsersListPage,
})

function UsersListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { session, permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState(data.roles[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canInvite = hasPermission(permissions, PERMISSION_KEYS["users.invite"])

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canInvite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await inviteUserFn({
        data: { email: inviteEmail, roleId: inviteRoleId },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage(`Invite sent. Activation URL: ${result.data.activationUrl}`)
      setInviteEmail("")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Team members</h1>
        <p className="text-sm text-muted-foreground">
          Manage agency staff, invitations, and access.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <input
            name="search"
            defaultValue={search.search ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
            placeholder="Name or email"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={search.status ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          Filter
        </button>
      </form>

      {canInvite ? (
        <form
          onSubmit={handleInvite}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h2 className="font-medium">Invite teammate</h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="colleague@agency.com"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <select
              required
              value={inviteRoleId}
              onChange={(event) => setInviteRoleId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              {data.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(buttonVariants(), "h-10")}
            >
              {isSubmitting ? "Sending..." : "Send invite"}
            </button>
          </div>
          {message ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {message}
            </p>
          ) : null}
        </form>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.users.items.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/users/$userId"
                    params={{ userId: user.id }}
                    className="font-medium hover:underline"
                  >
                    {user.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.users.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No users match this filter.
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Signed in as {session.user.displayName}. {data.users.total} total users.
      </p>
    </section>
  )
}

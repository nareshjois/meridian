import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"
import { z } from "zod"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { createGroupFn } from "@/server/services/groups/actions"
import { loadGroupsIndexFn } from "@/server/services/groups/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

const groupListSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["planning", "active", "completed"]).optional(),
})

export const Route = createFileRoute("/app/groups/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["groups.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    groupListSearchSchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["groups.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    return loadGroupsIndexFn({ data: deps.search })
  },
  component: GroupsListPage,
})

function GroupsListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { data } = Route.useLoaderData()
  const { permissions } = Route.useRouteContext()
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["groups.write"])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createGroupFn({ data: { name } })
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage(`Created group "${result.data.name}".`)
      setName("")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Travel groups</h1>
        <p className="text-sm text-muted-foreground">
          Organize customers into trip and tour groups.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <input
            name="search"
            defaultValue={search.search ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
            placeholder="Group name"
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
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          Filter
        </button>
      </form>

      {canWrite ? (
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
        >
          <label className="flex-1 space-y-1 text-sm">
            <span className="text-muted-foreground">New group name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3"
              placeholder="Summer Europe tour"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(buttonVariants(), "h-10")}
          >
            {isSubmitting ? "Creating..." : "Create group"}
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Dates</th>
            </tr>
          </thead>
          <tbody>
            {data.groups.items.map((group) => (
              <tr key={group.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/groups/$groupId"
                    params={{ groupId: group.id }}
                    className="font-medium hover:underline"
                  >
                    {group.name}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{group.status}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {group.startDate
                    ? new Date(group.startDate).toLocaleDateString()
                    : "—"}
                  {group.endDate
                    ? ` – ${new Date(group.endDate).toLocaleDateString()}`
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.groups.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No groups match this filter.
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {data.groups.total} total groups.
      </p>
    </section>
  )
}

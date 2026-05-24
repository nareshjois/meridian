import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"
import { z } from "zod"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { createCustomerFamilyFn } from "@/server/services/customer-families/actions"
import { loadCustomerFamiliesIndexFn } from "@/server/services/customer-families/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

const familyListSearchSchema = z.object({
  search: z.string().optional(),
})

export const Route = createFileRoute("/app/customer-families/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["customer_families.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    familyListSearchSchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["customer_families.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    return loadCustomerFamiliesIndexFn({ data: deps.search })
  },
  component: CustomerFamiliesListPage,
})

function CustomerFamiliesListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { data } = Route.useLoaderData()
  const { permissions } = Route.useRouteContext()
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(
    permissions,
    PERMISSION_KEYS["customer_families.write"],
  )

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createCustomerFamilyFn({ data: { name } })
      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage(`Created family "${result.data.name}".`)
      setName("")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Customer families</h1>
        <p className="text-sm text-muted-foreground">
          Group related customers into households and family units.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <input
            name="search"
            defaultValue={search.search ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
            placeholder="Family name"
          />
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
            <span className="text-muted-foreground">New family name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3"
              placeholder="Smith family"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(buttonVariants(), "h-10")}
          >
            {isSubmitting ? "Creating..." : "Create family"}
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.families.items.map((family) => (
              <tr key={family.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/customer-families/$familyId"
                    params={{ familyId: family.id }}
                    className="font-medium hover:underline"
                  >
                    {family.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(family.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.families.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No families match this filter.
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {data.families.total} total families.
      </p>
    </section>
  )
}

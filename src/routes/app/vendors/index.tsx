import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { createVendorFn } from "@/server/services/vendors/actions"
import { loadVendorsIndexFn } from "@/server/services/vendors/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { vendorListQuerySchema } from "@/shared/validation/dtos/vendors"

export const Route = createFileRoute("/app/vendors/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["vendors.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    vendorListQuerySchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["vendors.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    return loadVendorsIndexFn({ data: deps.search })
  },
  component: VendorsListPage,
})

function VendorsListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["vendors.write"])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createVendorFn({
        data: {
          name,
          email: email || undefined,
        },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage(`Vendor "${result.data.name}" created.`)
      setName("")
      setEmail("")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
        <p className="text-sm text-muted-foreground">
          Manage suppliers, bills, and payables.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <input
            name="search"
            defaultValue={search.search ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
            placeholder="Name, email, or phone"
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

      {canWrite ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h2 className="font-medium">Add vendor</h2>
          <div className="flex flex-wrap gap-3">
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Vendor name"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email (optional)"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(buttonVariants(), "h-10")}
            >
              {isSubmitting ? "Saving..." : "Create vendor"}
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
            {data.vendors.items.map((vendor) => (
              <tr key={vendor.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/vendors/$vendorId"
                    params={{ vendorId: vendor.id }}
                    className="font-medium hover:underline"
                  >
                    {vendor.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {vendor.email ?? "—"}
                </td>
                <td className="px-4 py-3 capitalize">{vendor.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.vendors.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No vendors match this filter.
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {data.vendors.total} total vendors.
      </p>
    </section>
  )
}

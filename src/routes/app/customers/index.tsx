import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { createCustomerFn } from "@/server/services/customers/actions"
import { loadCustomersIndexFn } from "@/server/services/customers/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"
import { customerListQuerySchema } from "@/shared/validation/dtos/crm"

export const Route = createFileRoute("/app/customers/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["customers.read"]],
  },
  validateSearch: (search: Record<string, unknown>) =>
    customerListQuerySchema.parse(search),
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["customers.read"])
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    return loadCustomersIndexFn({ data: deps.search })
  },
  component: CustomersListPage,
})

function CustomersListPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const { data } = Route.useLoaderData()
  const { permissions } = Route.useRouteContext()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["customers.write"])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createCustomerFn({
        data: {
          displayName,
          email: email || undefined,
          phone: phone || undefined,
        },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage(`Created ${result.data.displayName}.`)
      setDisplayName("")
      setEmail("")
      setPhone("")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer records, contacts, and CRM data.
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
          <h2 className="font-medium">New customer</h2>
          <div className="flex flex-wrap gap-3">
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display name"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email (optional)"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone (optional)"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(buttonVariants(), "h-10")}
            >
              {isSubmitting ? "Creating..." : "Create customer"}
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
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.customers.items.map((customer) => (
              <tr key={customer.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/customers/$customerId"
                    params={{ customerId: customer.id }}
                    className="font-medium hover:underline"
                  >
                    {customer.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.phone ?? "—"}
                </td>
                <td className="px-4 py-3 capitalize">{customer.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.customers.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No customers match this filter.
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {data.customers.total} total customers.
      </p>
    </section>
  )
}

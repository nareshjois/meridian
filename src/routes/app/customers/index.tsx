import { Link, createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  formatCustomerLocation,
  formatCustomerPhone,
} from "@/shared/geo/countries"
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
  const search = Route.useSearch()
  const { data } = Route.useLoaderData()
  const { permissions } = Route.useRouteContext()

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["customers.write"])

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer records, contacts, and CRM data.
          </p>
        </div>
        {canWrite ? (
          <Link
            to="/app/customers/new"
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            Add customer
          </Link>
        ) : null}
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <input
            name="search"
            defaultValue={search.search ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
            placeholder="Name, email, phone, passport, city"
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
        <Button type="submit" variant="outline" className="h-10">
          Filter
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Location</th>
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
                  {formatCustomerPhone(customer.phoneCountryCode, customer.phone) ??
                    "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCustomerLocation(
                    customer.city,
                    customer.state,
                    customer.countryCode,
                  ) ?? "—"}
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

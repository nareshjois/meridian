import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { updateCustomerFn } from "@/server/services/customers/actions"
import { loadCustomerDetailFn } from "@/server/services/customers/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/customers/$customerId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["customers.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["customers.read"])
  },
  loader: async ({ params }) => {
    return loadCustomerDetailFn({ data: { customerId: params.customerId } })
  },
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const router = useRouter()
  const { customerId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [displayName, setDisplayName] = useState(data.customer.displayName)
  const [email, setEmail] = useState(data.customer.email ?? "")
  const [phone, setPhone] = useState(data.customer.phone ?? "")
  const [status, setStatus] = useState<"active" | "inactive">(
    data.customer.status,
  )
  const [message, setMessage] = useState("")

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["customers.write"])

  async function handleSave() {
    if (!canWrite) {
      return
    }

    setMessage("")
    const result = await updateCustomerFn({
      data: {
        customerId,
        input: {
          displayName,
          email: email || undefined,
          phone: phone || undefined,
          status,
        },
      },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage("Customer updated.")
    await router.invalidate()
  }

  return (
    <section className="space-y-6">
      <div>
        <Link
          to="/app/customers"
          search={{ page: 1, pageSize: 25, sortDirection: "asc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to customers
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {data.customer.displayName}
        </h1>
      </div>

      {canWrite ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="font-medium">Edit customer</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Phone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "active" | "inactive")
                }
                className="h-10 w-full rounded-md border border-border bg-background px-3"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className={cn(buttonVariants())}
            onClick={handleSave}
          >
            Save changes
          </button>
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          <p>Email: {data.customer.email ?? "—"}</p>
          <p>Phone: {data.customer.phone ?? "—"}</p>
          <p className="capitalize">Status: {data.customer.status}</p>
        </div>
      )}

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  )
}

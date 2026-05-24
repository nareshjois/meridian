import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  CustomerFormFields,
  customerToFormValues,
  toCustomerPayload,
} from "@/features/customers/CustomerFormFields"
import { DeleteEntityButton } from "@/features/crm/DeleteEntityButton"
import {
  formatCustomerLocation,
  formatCustomerPhone,
  findCountryByCode,
} from "@/shared/geo/countries"
import { deleteCustomerFn, updateCustomerFn } from "@/server/services/customers/actions"
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
  const [values, setValues] = useState(() => customerToFormValues(data.customer))
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["customers.write"])
  const customer = data.customer
  const countryName =
    findCountryByCode(customer.countryCode)?.name ?? customer.countryCode

  async function handleSave() {
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await updateCustomerFn({
        data: {
          customerId,
          input: toCustomerPayload(values),
        },
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      setMessage("Customer updated.")
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/app/customers"
          search={{ page: 1, pageSize: 25, sortDirection: "asc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to customers
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {customer.displayName}
        </h1>
      </div>

      {canWrite ? (
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="font-medium">Edit customer</h2>
          <CustomerFormFields
            values={values}
            onChange={setValues}
            showStatus
            idPrefix="edit-customer"
          />
          <Button type="button" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border p-6 text-sm">
          <p>Email: {customer.email ?? "—"}</p>
          <p>
            Phone:{" "}
            {formatCustomerPhone(customer.phoneCountryCode, customer.phone) ?? "—"}
          </p>
          <p>Address: {customer.address ?? "—"}</p>
          <p>
            Location:{" "}
            {formatCustomerLocation(
              customer.city,
              customer.state,
              customer.countryCode,
            ) ?? "—"}
          </p>
          <p>Country: {countryName}</p>
          <p>Date of birth: {customer.dateOfBirth ?? "—"}</p>
          <p>Passport: {customer.passportNumber ?? "—"}</p>
          <p className="capitalize">Status: {customer.status}</p>
        </div>
      )}

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

      {canWrite ? (
        <DeleteEntityButton
          entityLabel="customer"
          confirmMessage={`Delete ${customer.displayName}? This cannot be undone.`}
          onDelete={() => deleteCustomerFn({ data: { customerId } })}
          onSuccess={() =>
            router.navigate({
              to: "/app/customers",
              search: { page: 1, pageSize: 25, sortDirection: "asc" },
            })
          }
        />
      ) : null}
    </section>
  )
}

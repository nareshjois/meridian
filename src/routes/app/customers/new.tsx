import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  CustomerFormFields,
  emptyCustomerFormValues,
  toCustomerPayload,
} from "@/features/customers/CustomerFormFields"
import { createCustomerFn } from "@/server/services/customers/actions"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/customers/new")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["customers.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["customers.read"])
  },
  component: NewCustomerPage,
})

function NewCustomerPage() {
  const router = useRouter()
  const { permissions } = Route.useRouteContext()
  const [values, setValues] = useState(emptyCustomerFormValues)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["customers.write"])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const result = await createCustomerFn({
        data: toCustomerPayload(values),
      })

      if (!result.ok) {
        setMessage(result.error.message)
        return
      }

      await router.navigate({
        to: "/app/customers/$customerId",
        params: { customerId: result.data.id },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canWrite) {
    return (
      <section className="space-y-4">
        <Link
          to="/app/customers"
          search={{ page: 1, pageSize: 25, sortDirection: "asc" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to customers
        </Link>
        <p className="text-sm text-muted-foreground">
          You do not have permission to create customers.
        </p>
      </section>
    )
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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Add customer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a customer profile with contact details and travel documents.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-border p-6"
      >
        <CustomerFormFields
          values={values}
          onChange={setValues}
          idPrefix="new-customer"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create customer"}
          </Button>
          <Link
            to="/app/customers"
            search={{ page: 1, pageSize: 25, sortDirection: "asc" }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>

        {message ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {message}
          </p>
        ) : null}
      </form>
    </section>
  )
}

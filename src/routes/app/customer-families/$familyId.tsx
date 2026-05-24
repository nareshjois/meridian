import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { DeleteEntityButton } from "@/features/crm/DeleteEntityButton"
import {
  addFamilyMemberFn,
  deleteCustomerFamilyFn,
  removeFamilyMemberFn,
} from "@/server/services/customer-families/actions"
import { loadCustomerFamilyDetailFn } from "@/server/services/customer-families/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/customer-families/$familyId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["customer_families.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["customer_families.read"])
  },
  loader: async ({ params }) => {
    return loadCustomerFamilyDetailFn({ data: { familyId: params.familyId } })
  },
  component: CustomerFamilyDetailPage,
})

function CustomerFamilyDetailPage() {
  const router = useRouter()
  const { familyId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [customerId, setCustomerId] = useState("")
  const [role, setRole] = useState<"head" | "spouse" | "child" | "other">("other")
  const [message, setMessage] = useState("")

  const canWrite = hasPermission(
    permissions,
    PERMISSION_KEYS["customer_families.write"],
  )

  const memberCustomerIds = new Set(
    data.members.map((member: (typeof data.members)[number]) => member.customerId),
  )
  const availableCustomers = data.customerPicker.filter(
    (customer) => !memberCustomerIds.has(customer.id),
  )

  async function handleAddMember() {
    if (!canWrite || !customerId) {
      return
    }

    setMessage("")
    const result = await addFamilyMemberFn({
      data: { familyId, customerId, role },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage("Member added.")
    setCustomerId("")
    await router.invalidate()
  }

  async function handleRemoveMember(memberCustomerId: string) {
    if (!canWrite) {
      return
    }

    setMessage("")
    const result = await removeFamilyMemberFn({
      data: { familyId, customerId: memberCustomerId },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage("Member removed.")
    await router.invalidate()
  }

  return (
    <section className="space-y-6">
      <div>
        <Link
          to="/app/customer-families"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to families
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {data.family.name}
        </h1>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-medium">Members</h2>
        <ul className="space-y-2 text-sm">
          {data.members.length === 0 ? (
            <li className="text-muted-foreground">No members yet.</li>
          ) : (
            data.members.map((member: (typeof data.members)[number]) => (
              <li key={member.id} className="flex items-center justify-between">
                <span>
                  <Link
                    to="/app/customers/$customerId"
                    params={{ customerId: member.customerId }}
                    className="font-medium hover:underline"
                  >
                    {member.displayName}
                  </Link>
                  <span className="ml-2 capitalize text-muted-foreground">
                    ({member.role})
                  </span>
                </span>
                {canWrite ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemoveMember(member.customerId)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>

        {canWrite ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Select customer</option>
              {availableCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName}
                </option>
              ))}
            </select>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as typeof role)
              }
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="head">Head</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="other">Other</option>
            </select>
            <button
              type="button"
              disabled={!customerId}
              className={cn(buttonVariants())}
              onClick={handleAddMember}
            >
              Add member
            </button>
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}

      {canWrite ? (
        <DeleteEntityButton
          entityLabel="family"
          confirmMessage={`Delete ${data.family.name}? Member links will be removed.`}
          onDelete={() => deleteCustomerFamilyFn({ data: { familyId } })}
          onSuccess={() => router.navigate({ to: "/app/customer-families" })}
        />
      ) : null}
    </section>
  )
}

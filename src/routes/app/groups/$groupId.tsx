import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { addGroupMemberFn, removeGroupMemberFn } from "@/server/services/groups/actions"
import { loadGroupDetailFn } from "@/server/services/groups/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/groups/$groupId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["groups.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["groups.read"])
  },
  loader: async ({ params }) => {
    return loadGroupDetailFn({ data: { groupId: params.groupId } })
  },
  component: GroupDetailPage,
})

function GroupDetailPage() {
  const router = useRouter()
  const { groupId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [customerId, setCustomerId] = useState("")
  const [role, setRole] = useState("traveler")
  const [message, setMessage] = useState("")

  const canWrite = hasPermission(permissions, PERMISSION_KEYS["groups.write"])

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
    const result = await addGroupMemberFn({
      data: { groupId, customerId, role },
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
    const result = await removeGroupMemberFn({
      data: { groupId, customerId: memberCustomerId },
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
          to="/app/groups"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to groups
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {data.group.name}
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          Status: {data.group.status}
        </p>
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
                  <span className="ml-2 text-muted-foreground">({member.role})</span>
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
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
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
    </section>
  )
}

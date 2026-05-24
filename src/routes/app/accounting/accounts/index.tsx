import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { createAccountFn } from "@/server/services/accounting/actions"
import { loadAccountsIndexFn } from "@/server/services/accounting/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/accounting/accounts/")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.accounts.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.accounts.read"],
    )
  },
  loader: () => loadAccountsIndexFn(),
  component: AccountsPage,
})

function AccountsPage() {
  const router = useRouter()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<
    "asset" | "liability" | "equity" | "revenue" | "expense"
  >("expense")
  const [message, setMessage] = useState("")
  const canWrite = hasPermission(
    permissions,
    PERMISSION_KEYS["accounting.accounts.write"],
  )

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWrite) {
      return
    }

    const normalBalance =
      type === "asset" || type === "expense" ? "debit" : "credit"

    const result = await createAccountFn({
      data: { code, name, type, normalBalance },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage(`Account ${result.data.code} created.`)
    setCode("")
    setName("")
    await router.invalidate()
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chart of accounts
        </h1>
        <p className="text-sm text-muted-foreground">
          Agency account catalog for journal postings.
        </p>
      </div>

      {canWrite ? (
        <form
          onSubmit={handleCreate}
          className="grid max-w-xl gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
        >
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Code</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Type</span>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as typeof type)
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground sm:col-span-2"
          >
            Add account
          </button>
          {message ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">{message}</p>
          ) : null}
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Normal</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.items.map((account) => (
              <tr key={account.id} className="border-b border-border/60">
                <td className="px-4 py-2 font-mono">{account.code}</td>
                <td className="px-4 py-2">{account.name}</td>
                <td className="px-4 py-2 capitalize">{account.type}</td>
                <td className="px-4 py-2 capitalize">{account.normalBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

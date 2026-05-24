import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { reverseJournalEntryFn } from "@/server/services/accounting/actions"
import { loadJournalDetailFn } from "@/server/services/accounting/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/accounting/journal/$entryId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["accounting.journals.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(
      context.permissions,
      PERMISSION_KEYS["accounting.journals.read"],
    )
  },
  loader: ({ params }) =>
    loadJournalDetailFn({ data: { entryId: params.entryId } }),
  component: JournalDetailPage,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

function JournalDetailPage() {
  const router = useRouter()
  const { entryId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")

  const canReverse = hasPermission(
    permissions,
    PERMISSION_KEYS["accounting.journals.reverse"],
  )

  async function handleReverse() {
    if (!canReverse) {
      return
    }

    const result = await reverseJournalEntryFn({
      data: { entryId, memo: `Reversal of ${data.entry.entryNumber}` },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage(`Reversal posted: ${result.data.entryNumber}`)
    await router.invalidate()
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/app/accounting/journal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Journal
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {data.entry.entryNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.entry.memo ?? "No memo"}
          {data.source
            ? ` · ${data.source.sourceType} (${data.source.eventType})`
            : ""}
        </p>
      </div>

      {canReverse && !data.entry.reversalOfEntryId ? (
        <button
          type="button"
          onClick={handleReverse}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Reverse entry
        </button>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2 font-medium">Account</th>
              <th className="px-4 py-2 font-medium text-right">Debit</th>
              <th className="px-4 py-2 font-medium text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line) => (
              <tr key={line.id} className="border-b border-border/60">
                <td className="px-4 py-2 font-mono text-xs">{line.accountId}</td>
                <td className="px-4 py-2 text-right">
                  {line.debitCents > 0 ? formatCents(line.debitCents) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {line.creditCents > 0 ? formatCents(line.creditCents) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

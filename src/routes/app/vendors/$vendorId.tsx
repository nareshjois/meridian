import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import type { FormEvent } from "react"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  createVendorBillFn,
  recordVendorPaymentFn,
  updateVendorFn,
} from "@/server/services/vendors/actions"
import { loadVendorDetailFn } from "@/server/services/vendors/loaders"
import {
  PERMISSION_KEYS,
  assertPermission,
  hasPermission,
} from "@/shared/permissions"

export const Route = createFileRoute("/app/vendors/$vendorId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["vendors.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["vendors.read"])
  },
  loader: async ({ params }) => {
    return loadVendorDetailFn({ data: { vendorId: params.vendorId } })
  },
  component: VendorDetailPage,
})

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100)
}

function VendorDetailPage() {
  const router = useRouter()
  const { vendorId } = Route.useParams()
  const { permissions } = Route.useRouteContext()
  const { data } = Route.useLoaderData()
  const [message, setMessage] = useState("")

  const canWriteVendor = hasPermission(permissions, PERMISSION_KEYS["vendors.write"])
  const canWriteBills = hasPermission(
    permissions,
    PERMISSION_KEYS["vendor_bills.write"],
  )
  const canRecordPayments = hasPermission(
    permissions,
    PERMISSION_KEYS["vendor_payments.write"],
  )

  const [billNumber, setBillNumber] = useState("")
  const [lineDescription, setLineDescription] = useState("")
  const [lineUnitCost, setLineUnitCost] = useState("")
  const [payableAccountId, setPayableAccountId] = useState("")

  const [paymentBillId, setPaymentBillId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [cashAccountId, setCashAccountId] = useState("")
  const [paymentPayableAccountId, setPaymentPayableAccountId] = useState("")

  async function toggleStatus() {
    if (!canWriteVendor) {
      return
    }

    setMessage("")
    const nextStatus = data.vendor.status === "active" ? "inactive" : "active"
    const result = await updateVendorFn({
      data: { vendorId, input: { status: nextStatus } },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage(`Vendor marked ${nextStatus}.`)
    await router.invalidate()
  }

  async function handleCreateBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canWriteBills) {
      return
    }

    const unitCostCents = Math.round(parseFloat(lineUnitCost) * 100)
    if (!Number.isFinite(unitCostCents) || unitCostCents <= 0) {
      setMessage("Enter a valid line amount.")
      return
    }

    setMessage("")
    const result = await createVendorBillFn({
      data: {
        vendorId,
        billNumber,
        items: [
          {
            description: lineDescription,
            quantity: 1,
            unitCostCents,
          },
        ],
        payableAccountId: payableAccountId || undefined,
      },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage(`Bill ${result.data.billNumber} created (${result.data.status}).`)
    setBillNumber("")
    setLineDescription("")
    setLineUnitCost("")
    await router.invalidate()
  }

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canRecordPayments) {
      return
    }

    const amountCents = Math.round(parseFloat(paymentAmount) * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setMessage("Enter a valid payment amount.")
      return
    }

    setMessage("")
    const result = await recordVendorPaymentFn({
      data: {
        vendorId,
        vendorBillId: paymentBillId || undefined,
        amountCents,
        paidAt: new Date(),
        cashAccountId: cashAccountId || undefined,
        payableAccountId: paymentPayableAccountId || undefined,
      },
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    setMessage("Payment recorded.")
    setPaymentBillId("")
    setPaymentAmount("")
    await router.invalidate()
  }

  const openBills = data.bills.items.filter(
    (bill) => bill.status === "open" || bill.status === "partially_paid",
  )

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <Link
          to="/app/vendors"
          search={{ page: 1, pageSize: 25, sortDirection: "asc" }}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Vendors
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{data.vendor.name}</h1>
        <p className="text-sm text-muted-foreground">
          {data.vendor.email ?? "No email"} ·{" "}
          <span className="capitalize">{data.vendor.status}</span>
        </p>
      </div>

      {canWriteVendor ? (
        <button
          type="button"
          onClick={toggleStatus}
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          Mark {data.vendor.status === "active" ? "inactive" : "active"}
        </button>
      ) : null}

      {canWriteBills ? (
        <form
          onSubmit={handleCreateBill}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h2 className="font-medium">New vendor bill</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={billNumber}
              onChange={(event) => setBillNumber(event.target.value)}
              placeholder="Bill number"
              className="h-10 rounded-md border border-border bg-background px-3"
            />
            <input
              value={payableAccountId}
              onChange={(event) => setPayableAccountId(event.target.value)}
              placeholder="Payable account ID (optional, posts bill)"
              className="h-10 rounded-md border border-border bg-background px-3 font-mono text-xs"
            />
            <input
              required
              value={lineDescription}
              onChange={(event) => setLineDescription(event.target.value)}
              placeholder="Line description"
              className="h-10 rounded-md border border-border bg-background px-3 sm:col-span-2"
            />
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={lineUnitCost}
              onChange={(event) => setLineUnitCost(event.target.value)}
              placeholder="Amount (USD)"
              className="h-10 rounded-md border border-border bg-background px-3"
            />
          </div>
          <button type="submit" className={cn(buttonVariants(), "h-10")}>
            Create bill
          </button>
          <p className="text-xs text-muted-foreground">
            Bills post to <span className="font-medium">open</span> when payable
            and expense account IDs are available (set vendor default expense or
            line expense account).
          </p>
        </form>
      ) : null}

      {canRecordPayments ? (
        <form
          onSubmit={handleRecordPayment}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h2 className="font-medium">Record payment</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={paymentBillId}
              onChange={(event) => setPaymentBillId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 sm:col-span-2"
            >
              <option value="">Unlinked payment</option>
              {openBills.map((bill) => (
                <option key={bill.id} value={bill.id}>
                  {bill.billNumber} ({bill.status}) —{" "}
                  {formatMoney(bill.totalCents, bill.currency)}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Amount (USD)"
              className="h-10 rounded-md border border-border bg-background px-3"
            />
            <input
              value={cashAccountId}
              onChange={(event) => setCashAccountId(event.target.value)}
              placeholder="Cash account ID (optional)"
              className="h-10 rounded-md border border-border bg-background px-3 font-mono text-xs"
            />
            <input
              value={paymentPayableAccountId}
              onChange={(event) => setPaymentPayableAccountId(event.target.value)}
              placeholder="Payable account ID (optional)"
              className="h-10 rounded-md border border-border bg-background px-3 font-mono text-xs sm:col-span-2"
            />
          </div>
          <button type="submit" className={cn(buttonVariants(), "h-10")}>
            Record payment
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium">
          Bills
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.bills.items.map((bill) => (
              <tr key={bill.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/app/vendors/bills/$billId"
                    params={{ billId: bill.id }}
                    className="font-medium hover:underline"
                  >
                    {bill.billNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{bill.status}</td>
                <td className="px-4 py-3">
                  {formatMoney(bill.totalCents, bill.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.bills.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No bills yet.</p>
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

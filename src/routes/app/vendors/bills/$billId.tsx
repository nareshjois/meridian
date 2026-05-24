import { Link, createFileRoute } from "@tanstack/react-router"

import { loadVendorBillDetailFn } from "@/server/services/vendors/loaders"
import { PERMISSION_KEYS, assertPermission } from "@/shared/permissions"

export const Route = createFileRoute("/app/vendors/bills/$billId")({
  staticData: {
    requiredPermissions: [PERMISSION_KEYS["vendor_bills.read"]],
  },
  beforeLoad: ({ context }) => {
    assertPermission(context.permissions, PERMISSION_KEYS["vendor_bills.read"])
  },
  loader: async ({ params }) => {
    return loadVendorBillDetailFn({ data: { billId: params.billId } })
  },
  component: VendorBillDetailPage,
})

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100)
}

function VendorBillDetailPage() {
  const { data } = Route.useLoaderData()
  const bill = data.bill
  const remainingCents = Math.max(0, bill.totalCents - bill.paidCents)

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <Link
          to="/app/vendors/$vendorId"
          params={{ vendorId: bill.vendorId }}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to vendor
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bill {bill.billNumber}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">
          Status: {bill.status} · Total {formatMoney(bill.totalCents, bill.currency)}{" "}
          · Paid {formatMoney(bill.paidCents, bill.currency)} · Remaining{" "}
          {formatMoney(remainingCents, bill.currency)}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium">
          Line items
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  {formatMoney(item.unitCostCents, bill.currency)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(item.quantity * item.unitCostCents, bill.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium">
          Payments
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {bill.payments.map((payment) => (
              <tr key={payment.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {new Date(payment.paidAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(payment.amountCents, bill.currency)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.reference ?? payment.paymentMethod ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bill.payments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No payments recorded for this bill.
          </p>
        ) : null}
      </div>
    </section>
  )
}

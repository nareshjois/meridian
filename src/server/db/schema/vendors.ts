import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"

export const vendors = sqliteTable(
  "vendors",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    defaultExpenseAccountId: text("default_expense_account_id"),
    ...timestampColumns,
  },
  (table) => [
    index("vendors_agency_name_idx").on(table.agencyId, table.name),
  ],
)

export const vendorContacts = sqliteTable(
  "vendor_contacts",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns,
  },
  (table) => [index("vendor_contacts_vendor_id_idx").on(table.vendorId)],
)

export const vendorBills = sqliteTable(
  "vendor_bills",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id),
    billNumber: text("bill_number").notNull(),
    status: text("status", {
      enum: ["draft", "open", "partially_paid", "paid", "void"],
    })
      .notNull()
      .default("draft"),
    currency: text("currency").notNull().default("USD"),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    totalCents: integer("total_cents").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [
    index("vendor_bills_agency_status_idx").on(table.agencyId, table.status),
    index("vendor_bills_vendor_id_idx").on(table.vendorId),
  ],
)

export const vendorBillItems = sqliteTable(
  "vendor_bill_items",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    vendorBillId: text("vendor_bill_id")
      .notNull()
      .references(() => vendorBills.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitCostCents: integer("unit_cost_cents").notNull(),
    expenseAccountId: text("expense_account_id"),
    ...timestampColumns,
  },
  (table) => [
    index("vendor_bill_items_vendor_bill_id_idx").on(table.vendorBillId),
  ],
)

export const vendorPayments = sqliteTable(
  "vendor_payments",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id),
    vendorBillId: text("vendor_bill_id").references(() => vendorBills.id),
    amountCents: integer("amount_cents").notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }).notNull(),
    paymentMethod: text("payment_method"),
    reference: text("reference"),
    ...timestampColumns,
  },
  (table) => [
    index("vendor_payments_vendor_id_idx").on(table.vendorId),
    index("vendor_payments_vendor_bill_id_idx").on(table.vendorBillId),
  ],
)

export type Vendor = typeof vendors.$inferSelect
export type VendorContact = typeof vendorContacts.$inferSelect
export type VendorBill = typeof vendorBills.$inferSelect
export type VendorBillItem = typeof vendorBillItems.$inferSelect
export type VendorPayment = typeof vendorPayments.$inferSelect

export const vendorTables = {
  vendors,
  vendorContacts,
  vendorBills,
  vendorBillItems,
  vendorPayments,
} as const

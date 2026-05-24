import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"

export const customers = sqliteTable(
  "customers",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    displayName: text("display_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    notesSummary: text("notes_summary"),
    ...timestampColumns,
  },
  (table) => [
    index("customers_agency_display_name_idx").on(
      table.agencyId,
      table.displayName,
    ),
    index("customers_agency_email_idx").on(table.agencyId, table.email),
  ],
)

export const customerContacts = sqliteTable(
  "customer_contacts",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    relationship: text("relationship"),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns,
  },
  (table) => [index("customer_contacts_customer_id_idx").on(table.customerId)],
)

export const customerNotes = sqliteTable(
  "customer_notes",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    body: text("body").notNull(),
    ...timestampColumns,
  },
  (table) => [index("customer_notes_customer_id_idx").on(table.customerId)],
)

export const customerDocuments = sqliteTable(
  "customer_documents",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type"),
    uploadedByUserId: text("uploaded_by_user_id").notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("customer_documents_customer_id_idx").on(table.customerId),
  ],
)

export type Customer = typeof customers.$inferSelect
export type CustomerContact = typeof customerContacts.$inferSelect
export type CustomerNote = typeof customerNotes.$inferSelect
export type CustomerDocument = typeof customerDocuments.$inferSelect

export const crmTables = {
  customers,
  customerContacts,
  customerNotes,
  customerDocuments,
} as const

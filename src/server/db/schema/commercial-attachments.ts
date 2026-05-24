import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"
import { vendors } from "./vendors"

export const commercialAttachments = sqliteTable(
  "commercial_attachments",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    entityType: text("entity_type", { enum: ["quote", "booking"] }).notNull(),
    entityId: text("entity_id").notNull(),
    kind: text("kind", { enum: ["document", "vendor_quote"] }).notNull(),
    label: text("label").notNull(),
    fileName: text("file_name"),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    vendorId: text("vendor_id").references(() => vendors.id),
    vendorReference: text("vendor_reference"),
    amountCents: integer("amount_cents"),
    currency: text("currency"),
    notes: text("notes"),
    uploadedByUserId: text("uploaded_by_user_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [
    index("commercial_attachments_entity_idx").on(
      table.agencyId,
      table.entityType,
      table.entityId,
    ),
    index("commercial_attachments_vendor_id_idx").on(table.vendorId),
  ],
)

export type CommercialAttachment = typeof commercialAttachments.$inferSelect

export const commercialAttachmentTables = {
  commercialAttachments,
} as const

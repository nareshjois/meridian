import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"
import { customers } from "./crm"

export const customerFamilies = sqliteTable(
  "customer_families",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    name: text("name").notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("customer_families_agency_name_idx").on(table.agencyId, table.name),
  ],
)

export const customerFamilyMembers = sqliteTable(
  "customer_family_members",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    familyId: text("family_id")
      .notNull()
      .references(() => customerFamilies.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["head", "spouse", "child", "other"],
    })
      .notNull()
      .default("other"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("customer_family_members_family_customer_uidx").on(
      table.familyId,
      table.customerId,
    ),
  ],
)

export type CustomerFamily = typeof customerFamilies.$inferSelect
export type CustomerFamilyMember = typeof customerFamilyMembers.$inferSelect

export const customerFamilyTables = {
  customerFamilies,
  customerFamilyMembers,
} as const

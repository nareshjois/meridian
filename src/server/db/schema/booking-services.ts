import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"

export const bookingServices = sqliteTable(
  "booking_services",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    defaultRevenueAccountId: text("default_revenue_account_id"),
    quoteFieldsSchemaJson: text("quote_fields_schema_json")
      .notNull()
      .default("[]"),
    bookingFieldsSchemaJson: text("booking_fields_schema_json")
      .notNull()
      .default("[]"),
    sameStartEndDefault: integer("same_start_end_default", { mode: "boolean" })
      .notNull()
      .default(false),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("booking_services_agency_code_uidx").on(
      table.agencyId,
      table.code,
    ),
    index("booking_services_agency_active_idx").on(
      table.agencyId,
      table.isActive,
    ),
  ],
)

export const bookingServiceRules = sqliteTable(
  "booking_service_rules",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    bookingServiceId: text("booking_service_id")
      .notNull()
      .references(() => bookingServices.id, { onDelete: "cascade" }),
    ruleKey: text("rule_key").notNull(),
    ruleValue: text("rule_value").notNull(),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("booking_service_rules_service_key_uidx").on(
      table.bookingServiceId,
      table.ruleKey,
    ),
  ],
)

export type BookingService = typeof bookingServices.$inferSelect
export type BookingServiceRule = typeof bookingServiceRules.$inferSelect

export const bookingServiceTables = {
  bookingServices,
  bookingServiceRules,
} as const

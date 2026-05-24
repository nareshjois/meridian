import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"
import { customers } from "./crm"
import { bookingServices } from "./booking-services"

export const quotes = sqliteTable(
  "quotes",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    quoteNumber: text("quote_number").notNull(),
    status: text("status", {
      enum: ["draft", "sent", "accepted", "declined", "expired"],
    })
      .notNull()
      .default("draft"),
    currency: text("currency").notNull().default("USD"),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    notes: text("notes"),
    ...timestampColumns,
  },
  (table) => [
    index("quotes_agency_status_idx").on(table.agencyId, table.status),
    index("quotes_customer_id_idx").on(table.customerId),
  ],
)

export const quoteItems = sqliteTable(
  "quote_items",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    bookingServiceId: text("booking_service_id")
      .notNull()
      .references(() => bookingServices.id),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    fieldsJson: text("fields_json").notNull().default("{}"),
    ...timestampColumns,
  },
  (table) => [index("quote_items_quote_id_idx").on(table.quoteId)],
)

export const quoteVersions = sqliteTable(
  "quote_versions",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("quote_versions_quote_id_idx").on(table.quoteId),
  ],
)

export const quoteAcceptanceEvents = sqliteTable(
  "quote_acceptance_events",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    eventType: text("event_type", { enum: ["accepted", "declined"] }).notNull(),
    actorType: text("actor_type", { enum: ["customer", "user"] }).notNull(),
    actorId: text("actor_id"),
    note: text("note"),
    ...timestampColumns,
  },
  (table) => [
    index("quote_acceptance_events_quote_id_idx").on(table.quoteId),
  ],
)

export type Quote = typeof quotes.$inferSelect
export type QuoteItem = typeof quoteItems.$inferSelect
export type QuoteVersion = typeof quoteVersions.$inferSelect
export type QuoteAcceptanceEvent = typeof quoteAcceptanceEvents.$inferSelect

export const quoteTables = {
  quotes,
  quoteItems,
  quoteVersions,
  quoteAcceptanceEvents,
} as const

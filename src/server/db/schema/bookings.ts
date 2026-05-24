import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"
import { customers } from "./crm"
import { bookingServices } from "./booking-services"
import { quotes } from "./quotes"
import { travelGroups } from "./groups"

export const bookings = sqliteTable(
  "bookings",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    quoteId: text("quote_id").references(() => quotes.id),
    groupId: text("group_id").references(() => travelGroups.id),
    bookingNumber: text("booking_number").notNull(),
    status: text("status", {
      enum: [
        "draft",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
    })
      .notNull()
      .default("draft"),
    currency: text("currency").notNull().default("USD"),
    ...timestampColumns,
  },
  (table) => [
    index("bookings_agency_status_idx").on(table.agencyId, table.status),
    index("bookings_customer_id_idx").on(table.customerId),
  ],
)

export const bookingItems = sqliteTable(
  "booking_items",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    bookingServiceId: text("booking_service_id")
      .notNull()
      .references(() => bookingServices.id),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [index("booking_items_booking_id_idx").on(table.bookingId)],
)

export const bookingStatusHistory = sqliteTable(
  "booking_status_history",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedByUserId: text("changed_by_user_id"),
    note: text("note"),
    ...timestampColumns,
  },
  (table) => [
    index("booking_status_history_booking_id_idx").on(table.bookingId),
  ],
)

export const bookingTravelers = sqliteTable(
  "booking_travelers",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    travelerRole: text("traveler_role").notNull().default("traveler"),
    ...timestampColumns,
  },
  (table) => [
    index("booking_travelers_booking_id_idx").on(table.bookingId),
  ],
)

export type Booking = typeof bookings.$inferSelect
export type BookingItem = typeof bookingItems.$inferSelect
export type BookingStatusHistory = typeof bookingStatusHistory.$inferSelect
export type BookingTraveler = typeof bookingTravelers.$inferSelect

export const bookingTables = {
  bookings,
  bookingItems,
  bookingStatusHistory,
  bookingTravelers,
} as const

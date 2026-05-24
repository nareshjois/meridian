import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"
import { customers } from "./crm"

export const travelGroups = sqliteTable(
  "travel_groups",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    name: text("name").notNull(),
    status: text("status", { enum: ["planning", "active", "completed"] })
      .notNull()
      .default("planning"),
    startDate: integer("start_date", { mode: "timestamp_ms" }),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    index("travel_groups_agency_name_idx").on(table.agencyId, table.name),
  ],
)

export const groupMembers = sqliteTable(
  "group_members",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    groupId: text("group_id")
      .notNull()
      .references(() => travelGroups.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("traveler"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("group_members_group_customer_uidx").on(
      table.groupId,
      table.customerId,
    ),
  ],
)

export const itineraries = sqliteTable(
  "itineraries",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    groupId: text("group_id")
      .notNull()
      .references(() => travelGroups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    ...timestampColumns,
  },
  (table) => [index("itineraries_group_id_idx").on(table.groupId)],
)

export type TravelGroup = typeof travelGroups.$inferSelect
export type GroupMember = typeof groupMembers.$inferSelect
export type Itinerary = typeof itineraries.$inferSelect

export const groupTables = {
  travelGroups,
  groupMembers,
  itineraries,
} as const

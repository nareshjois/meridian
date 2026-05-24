import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"

export const accounts = sqliteTable(
  "accounts",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["asset", "liability", "equity", "revenue", "expense"],
    }).notNull(),
    normalBalance: text("normal_balance", { enum: ["debit", "credit"] }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    parentAccountId: text("parent_account_id"),
    ...timestampColumns,
  },
  (table) => [
    index("accounts_agency_code_idx").on(table.agencyId, table.code),
    index("accounts_agency_type_idx").on(table.agencyId, table.type),
  ],
)

export const journalBatches = sqliteTable(
  "journal_batches",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    batchNumber: text("batch_number").notNull(),
    status: text("status", { enum: ["draft", "posted", "void"] })
      .notNull()
      .default("draft"),
    postedAt: integer("posted_at", { mode: "timestamp_ms" }),
    postedByUserId: text("posted_by_user_id"),
    memo: text("memo"),
    ...timestampColumns,
  },
  (table) => [
    index("journal_batches_agency_status_idx").on(table.agencyId, table.status),
  ],
)

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    batchId: text("batch_id")
      .notNull()
      .references(() => journalBatches.id, { onDelete: "cascade" }),
    entryNumber: text("entry_number").notNull(),
    entryDate: integer("entry_date", { mode: "timestamp_ms" }).notNull(),
    memo: text("memo"),
    reversalOfEntryId: text("reversal_of_entry_id"),
    ...timestampColumns,
  },
  (table) => [
    index("journal_entries_batch_id_idx").on(table.batchId),
    index("journal_entries_entry_date_idx").on(table.entryDate),
  ],
)

export const journalLines = sqliteTable(
  "journal_lines",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    entryId: text("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    debitCents: integer("debit_cents").notNull().default(0),
    creditCents: integer("credit_cents").notNull().default(0),
    memo: text("memo"),
    ...timestampColumns,
  },
  (table) => [
    index("journal_lines_entry_id_idx").on(table.entryId),
    index("journal_lines_account_id_idx").on(table.accountId),
  ],
)

export const postingSources = sqliteTable(
  "posting_sources",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    journalEntryId: text("journal_entry_id")
      .notNull()
      .references(() => journalEntries.id),
    eventType: text("event_type").notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("posting_sources_source_idx").on(table.sourceType, table.sourceId),
    index("posting_sources_journal_entry_id_idx").on(table.journalEntryId),
  ],
)

export type Account = typeof accounts.$inferSelect
export type JournalBatch = typeof journalBatches.$inferSelect
export type JournalEntry = typeof journalEntries.$inferSelect
export type JournalLine = typeof journalLines.$inferSelect
export type PostingSource = typeof postingSources.$inferSelect

export const accountingTables = {
  accounts,
  journalBatches,
  journalEntries,
  journalLines,
  postingSources,
} as const

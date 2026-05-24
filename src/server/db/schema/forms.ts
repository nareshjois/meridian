import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { agencyIdColumn, idColumn, timestampColumns } from "./_common"
import { customers } from "./crm"
import { bookings } from "./bookings"
import { quotes } from "./quotes"

export const formTemplates = sqliteTable(
  "form_templates",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    name: text("name").notNull(),
    schemaJson: text("schema_json").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestampColumns,
  },
  (table) => [
    index("form_templates_agency_active_idx").on(table.agencyId, table.isActive),
  ],
)

export const formRequests = sqliteTable(
  "form_requests",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    templateId: text("template_id")
      .notNull()
      .references(() => formTemplates.id),
    customerId: text("customer_id").references(() => customers.id),
    bookingId: text("booking_id").references(() => bookings.id),
    quoteId: text("quote_id").references(() => quotes.id),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", {
      enum: ["pending", "submitted", "expired", "revoked"],
    })
      .notNull()
      .default("pending"),
    ...timestampColumns,
  },
  (table) => [
    index("form_requests_agency_status_idx").on(table.agencyId, table.status),
    index("form_requests_token_hash_idx").on(table.tokenHash),
  ],
)

export const formSubmissions = sqliteTable(
  "form_submissions",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    formRequestId: text("form_request_id")
      .notNull()
      .references(() => formRequests.id),
    payloadJson: text("payload_json").notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
    reviewStatus: text("review_status", {
      enum: ["pending", "approved", "rejected"],
    })
      .notNull()
      .default("pending"),
    reviewedByUserId: text("reviewed_by_user_id"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    index("form_submissions_form_request_id_idx").on(table.formRequestId),
  ],
)

export const formSubmissionAudit = sqliteTable(
  "form_submission_audit",
  {
    id: idColumn(),
    agencyId: agencyIdColumn(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => formSubmissions.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    actorUserId: text("actor_user_id"),
    note: text("note"),
    ...timestampColumns,
  },
  (table) => [
    index("form_submission_audit_submission_id_idx").on(table.submissionId),
  ],
)

export type FormTemplate = typeof formTemplates.$inferSelect
export type FormRequest = typeof formRequests.$inferSelect
export type FormSubmission = typeof formSubmissions.$inferSelect
export type FormSubmissionAudit = typeof formSubmissionAudit.$inferSelect

export const formTables = {
  formTemplates,
  formRequests,
  formSubmissions,
  formSubmissionAudit,
} as const

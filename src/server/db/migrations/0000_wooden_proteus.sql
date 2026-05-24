CREATE TABLE `agencies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`description` text,
	`module` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_uidx` ON `permissions` (`key`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_role_permission_uidx` ON `role_permissions` (`role_id`,`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_agency_key_uidx` ON `roles` (`agency_id`,`key`);--> statement-breakpoint
CREATE TABLE `user_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`email` text NOT NULL,
	`invited_by_user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_invites_agency_email_idx` ON `user_invites` (`agency_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_invites_token_hash_uidx` ON `user_invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_roles_user_role_uidx` ON `user_roles` (`user_id`,`role_id`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_token_hash_uidx` ON `user_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text,
	`status` text DEFAULT 'invited' NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_agency_email_uidx` ON `users` (`agency_id`,`email`);--> statement-breakpoint
CREATE INDEX `users_agency_status_idx` ON `users` (`agency_id`,`status`);--> statement-breakpoint
CREATE TABLE `customer_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`relationship` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_contacts_customer_id_idx` ON `customer_contacts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customer_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`label` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text,
	`uploaded_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_documents_customer_id_idx` ON `customer_documents` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customer_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_notes_customer_id_idx` ON `customer_notes` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`phone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes_summary` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_agency_display_name_idx` ON `customers` (`agency_id`,`display_name`);--> statement-breakpoint
CREATE INDEX `customers_agency_email_idx` ON `customers` (`agency_id`,`email`);--> statement-breakpoint
CREATE TABLE `customer_families` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_families_agency_name_idx` ON `customer_families` (`agency_id`,`name`);--> statement-breakpoint
CREATE TABLE `customer_family_members` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`family_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`role` text DEFAULT 'other' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `customer_families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_family_members_family_customer_uidx` ON `customer_family_members` (`family_id`,`customer_id`);--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`group_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`role` text DEFAULT 'traveler' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `travel_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_members_group_customer_uidx` ON `group_members` (`group_id`,`customer_id`);--> statement-breakpoint
CREATE TABLE `itineraries` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`group_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `travel_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `itineraries_group_id_idx` ON `itineraries` (`group_id`);--> statement-breakpoint
CREATE TABLE `travel_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `travel_groups_agency_name_idx` ON `travel_groups` (`agency_id`,`name`);--> statement-breakpoint
CREATE TABLE `booking_service_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`booking_service_id` text NOT NULL,
	`rule_key` text NOT NULL,
	`rule_value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_service_id`) REFERENCES `booking_services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_service_rules_service_key_uidx` ON `booking_service_rules` (`booking_service_id`,`rule_key`);--> statement-breakpoint
CREATE TABLE `booking_services` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`default_revenue_account_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_services_agency_code_uidx` ON `booking_services` (`agency_id`,`code`);--> statement-breakpoint
CREATE INDEX `booking_services_agency_active_idx` ON `booking_services` (`agency_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `quote_acceptance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`event_type` text NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_acceptance_events_quote_id_idx` ON `quote_acceptance_events` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`booking_service_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booking_service_id`) REFERENCES `booking_services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quote_items_quote_id_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quote_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_versions_quote_id_idx` ON `quote_versions` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`quote_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`valid_until` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quotes_agency_status_idx` ON `quotes` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `quotes_customer_id_idx` ON `quotes` (`customer_id`);--> statement-breakpoint
CREATE TABLE `booking_items` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`booking_service_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booking_service_id`) REFERENCES `booking_services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `booking_items_booking_id_idx` ON `booking_items` (`booking_id`);--> statement-breakpoint
CREATE TABLE `booking_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`changed_by_user_id` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `booking_status_history_booking_id_idx` ON `booking_status_history` (`booking_id`);--> statement-breakpoint
CREATE TABLE `booking_travelers` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`traveler_role` text DEFAULT 'traveler' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `booking_travelers_booking_id_idx` ON `booking_travelers` (`booking_id`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`quote_id` text,
	`group_id` text,
	`booking_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `travel_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bookings_agency_status_idx` ON `bookings` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `bookings_customer_id_idx` ON `bookings` (`customer_id`);--> statement-breakpoint
CREATE TABLE `vendor_bill_items` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`vendor_bill_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`expense_account_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_bill_id`) REFERENCES `vendor_bills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vendor_bill_items_vendor_bill_id_idx` ON `vendor_bill_items` (`vendor_bill_id`);--> statement-breakpoint
CREATE TABLE `vendor_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`bill_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`due_date` integer,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vendor_bills_agency_status_idx` ON `vendor_bills` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `vendor_bills_vendor_id_idx` ON `vendor_bills` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `vendor_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vendor_contacts_vendor_id_idx` ON `vendor_contacts` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `vendor_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`vendor_bill_id` text,
	`amount_cents` integer NOT NULL,
	`paid_at` integer NOT NULL,
	`payment_method` text,
	`reference` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_bill_id`) REFERENCES `vendor_bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vendor_payments_vendor_id_idx` ON `vendor_payments` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `vendor_payments_vendor_bill_id_idx` ON `vendor_payments` (`vendor_bill_id`);--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`default_expense_account_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vendors_agency_name_idx` ON `vendors` (`agency_id`,`name`);--> statement-breakpoint
CREATE TABLE `form_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`template_id` text NOT NULL,
	`customer_id` text,
	`booking_id` text,
	`quote_id` text,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `form_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `form_requests_agency_status_idx` ON `form_requests` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `form_requests_token_hash_idx` ON `form_requests` (`token_hash`);--> statement-breakpoint
CREATE TABLE `form_submission_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`submission_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_user_id` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `form_submissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_submission_audit_submission_id_idx` ON `form_submission_audit` (`submission_id`);--> statement-breakpoint
CREATE TABLE `form_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`form_request_id` text NOT NULL,
	`payload_json` text NOT NULL,
	`submitted_at` integer NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`form_request_id`) REFERENCES `form_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `form_submissions_form_request_id_idx` ON `form_submissions` (`form_request_id`);--> statement-breakpoint
CREATE TABLE `form_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`name` text NOT NULL,
	`schema_json` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `form_templates_agency_active_idx` ON `form_templates` (`agency_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`normal_balance` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`parent_account_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `accounts_agency_code_idx` ON `accounts` (`agency_id`,`code`);--> statement-breakpoint
CREATE INDEX `accounts_agency_type_idx` ON `accounts` (`agency_id`,`type`);--> statement-breakpoint
CREATE TABLE `journal_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`batch_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`posted_at` integer,
	`posted_by_user_id` text,
	`memo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `journal_batches_agency_status_idx` ON `journal_batches` (`agency_id`,`status`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`entry_number` text NOT NULL,
	`entry_date` integer NOT NULL,
	`memo` text,
	`reversal_of_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `journal_batches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `journal_entries_batch_id_idx` ON `journal_entries` (`batch_id`);--> statement-breakpoint
CREATE INDEX `journal_entries_entry_date_idx` ON `journal_entries` (`entry_date`);--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`account_id` text NOT NULL,
	`debit_cents` integer DEFAULT 0 NOT NULL,
	`credit_cents` integer DEFAULT 0 NOT NULL,
	`memo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `journal_lines_entry_id_idx` ON `journal_lines` (`entry_id`);--> statement-breakpoint
CREATE INDEX `journal_lines_account_id_idx` ON `journal_lines` (`account_id`);--> statement-breakpoint
CREATE TABLE `posting_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`journal_entry_id` text NOT NULL,
	`event_type` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `posting_sources_source_idx` ON `posting_sources` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `posting_sources_journal_entry_id_idx` ON `posting_sources` (`journal_entry_id`);
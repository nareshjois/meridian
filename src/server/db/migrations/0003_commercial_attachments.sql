CREATE TABLE `commercial_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`file_name` text,
	`storage_key` text,
	`mime_type` text,
	`vendor_id` text,
	`vendor_reference` text,
	`amount_cents` integer,
	`currency` text,
	`notes` text,
	`uploaded_by_user_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `commercial_attachments_entity_idx` ON `commercial_attachments` (`agency_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `commercial_attachments_vendor_id_idx` ON `commercial_attachments` (`vendor_id`);

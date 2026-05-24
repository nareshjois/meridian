ALTER TABLE `booking_services` ADD `quote_fields_schema_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_services` ADD `booking_fields_schema_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `quote_items` ADD `fields_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_items` ADD `fields_json` text DEFAULT '{}' NOT NULL;
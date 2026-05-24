ALTER TABLE `customers` ADD `phone_country_code` text DEFAULT '+91' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `address` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `city` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `state` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `country_code` text DEFAULT 'IN' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `date_of_birth` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `passport_number` text;
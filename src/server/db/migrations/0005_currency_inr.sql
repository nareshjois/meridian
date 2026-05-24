UPDATE `quotes` SET `currency` = 'INR' WHERE `currency` = 'USD';--> statement-breakpoint
UPDATE `bookings` SET `currency` = 'INR' WHERE `currency` = 'USD';--> statement-breakpoint
UPDATE `vendor_bills` SET `currency` = 'INR' WHERE `currency` = 'USD';--> statement-breakpoint
UPDATE `commercial_attachments` SET `currency` = 'INR' WHERE `currency` = 'USD' OR `currency` IS NULL;

CREATE TABLE `template_required_fields` (
	`id` varchar(191) NOT NULL,
	`template_id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_required_fields_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_template_required_fields` UNIQUE(`template_id`,`name`)
);
--> statement-breakpoint
ALTER TABLE `template_required_fields` ADD CONSTRAINT `template_required_fields_template_id_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE no action ON UPDATE no action;
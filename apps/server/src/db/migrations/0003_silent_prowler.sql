CREATE TABLE `template_sessions` (
	`id` varchar(191) NOT NULL,
	`token` text NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `templates` MODIFY COLUMN `max_count_hit` int NOT NULL;--> statement-breakpoint
ALTER TABLE `template_sessions` ADD CONSTRAINT `template_sessions_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
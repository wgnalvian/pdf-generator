ALTER TABLE `templates` ADD `max_count_hit` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `templates` ADD `expired_time` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `templates` ADD `password` varchar(191) NOT NULL;
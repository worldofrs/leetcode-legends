CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_progress` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`problems_solved` integer DEFAULT 0 NOT NULL,
	`total_submissions` integer DEFAULT 0 NOT NULL,
	`easy_solved` integer DEFAULT 0 NOT NULL,
	`medium_solved` integer DEFAULT 0 NOT NULL,
	`hard_solved` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_progress_date_unique` ON `daily_progress` (`date`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`target_count` integer NOT NULL,
	`current_count` integer DEFAULT 0 NOT NULL,
	`difficulty` text,
	`topic_tag` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` integer PRIMARY KEY NOT NULL,
	`leetcode_id` integer NOT NULL,
	`title` text NOT NULL,
	`title_slug` text NOT NULL,
	`difficulty` text NOT NULL,
	`topic_tags` text DEFAULT '[]' NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `problems_leetcode_id_unique` ON `problems` (`leetcode_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `problems_title_slug_unique` ON `problems` (`title_slug`);--> statement-breakpoint
CREATE TABLE `review_queue` (
	`id` integer PRIMARY KEY NOT NULL,
	`problem_id` integer NOT NULL,
	`next_review_at` integer NOT NULL,
	`interval` integer DEFAULT 1 NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`last_reviewed_at` integer,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY NOT NULL,
	`problem_id` integer NOT NULL,
	`status` text NOT NULL,
	`language` text NOT NULL,
	`runtime` integer,
	`memory` integer,
	`submitted_at` integer NOT NULL,
	`synced_at` integer NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE no action
);

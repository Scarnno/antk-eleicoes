CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`number` text NOT NULL,
	`proposals` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidates_normalized_name_unique` ON `candidates` (`normalized_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `candidates_number_unique` ON `candidates` (`number`);--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`voter_hash` text NOT NULL,
	`candidate_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_voter_hash_unique` ON `votes` (`voter_hash`);
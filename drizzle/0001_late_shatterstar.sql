CREATE TABLE `ballots` (
	`id` text PRIMARY KEY NOT NULL,
	`voter_hash` text NOT NULL,
	`round` integer NOT NULL,
	`candidate_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ballots_voter_round_unique` ON `ballots` (`voter_hash`,`round`);--> statement-breakpoint
CREATE TABLE `election` (
	`id` integer PRIMARY KEY NOT NULL,
	`phase` text DEFAULT 'registration' NOT NULL,
	`round` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`finalists` text DEFAULT '[]' NOT NULL
);

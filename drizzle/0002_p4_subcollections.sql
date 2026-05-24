CREATE TABLE `assessment` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`date` integer NOT NULL,
	`testType` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`percentile` real,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `biometricsLog` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`date` integer NOT NULL,
	`restingHeartRate` integer,
	`maxHeartRate` integer,
	`avgHeartRate` integer,
	`hrv` real,
	`sleepScore` integer,
	`sleepHours` real,
	`steps` integer,
	`activeMinutes` integer,
	`source` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cardioLog` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`date` integer NOT NULL,
	`activityType` text NOT NULL,
	`distanceMiles` real NOT NULL,
	`durationMinutes` real NOT NULL,
	`avgPacePerMile` text,
	`calories` integer,
	`avgHeartRate` integer,
	`maxHeartRate` integer,
	`location` text,
	`weather` text,
	`notes` text,
	`perceivedEffort` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dreamGym` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`profile` text NOT NULL,
	`schedule` text NOT NULL,
	`events` text DEFAULT '[]' NOT NULL,
	`mentalCheckIns` text DEFAULT '[]' NOT NULL,
	`mentalFavoriteTips` text DEFAULT '[]' NOT NULL,
	`mentalLastCheckIn` integer,
	`weeklyGrid` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dreamGym_playerId_unique` ON `dreamGym` (`playerId`);--> statement-breakpoint
CREATE TABLE `journalEntry` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`date` integer NOT NULL,
	`content` text NOT NULL,
	`context` text NOT NULL,
	`moodTag` text,
	`energyTag` text,
	`linkedWorkoutId` text,
	`linkedGameId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mealLog` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`date` integer NOT NULL,
	`mealType` text NOT NULL,
	`description` text NOT NULL,
	`calories` integer,
	`protein` real,
	`carbs` real,
	`fat` real,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `practiceLog` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`date` integer NOT NULL,
	`practiceType` text NOT NULL,
	`durationMinutes` integer NOT NULL,
	`focusAreas` text NOT NULL,
	`teamName` text,
	`location` text,
	`drillsCompleted` text,
	`intensity` integer,
	`enjoyment` integer,
	`improvement` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scheduleEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`playerIds` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`endDate` integer,
	`location` text,
	`opponent` text,
	`notes` text,
	`linkedGameId` text,
	`linkedGamePlayerId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workoutLog` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`workoutId` text,
	`date` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`duration` integer NOT NULL,
	`exercises` text NOT NULL,
	`totalVolume` integer,
	`completedAt` integer NOT NULL,
	`journalEntryId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);

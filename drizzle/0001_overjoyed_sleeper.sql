CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`workspaceId` text,
	`date` integer NOT NULL,
	`opponent` text NOT NULL,
	`result` text NOT NULL,
	`finalScore` text NOT NULL,
	`minutesPlayed` integer NOT NULL,
	`gameName` text,
	`gameLocation` text,
	`gameLeagueCode` text,
	`gameLeagueOtherName` text,
	`performanceRating` integer,
	`emotionTags` text,
	`goals` integer DEFAULT 0 NOT NULL,
	`assists` integer DEFAULT 0 NOT NULL,
	`tackles` integer,
	`interceptions` integer,
	`clearances` integer,
	`blocks` integer,
	`aerialDuelsWon` integer,
	`saves` integer,
	`goalsAgainst` integer,
	`cleanSheet` integer,
	`verified` integer DEFAULT false NOT NULL,
	`verifiedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `player` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`workspaceId` text,
	`name` text NOT NULL,
	`birthday` integer NOT NULL,
	`gender` text NOT NULL,
	`primaryPosition` text NOT NULL,
	`secondaryPositions` text,
	`positionNote` text,
	`position` text,
	`leagueCode` text NOT NULL,
	`leagueOtherName` text,
	`teamClub` text NOT NULL,
	`photoUrl` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`email` text PRIMARY KEY NOT NULL,
	`firstName` text,
	`lastName` text,
	`source` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaceInvite` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`workspaceName` text NOT NULL,
	`invitedEmail` text NOT NULL,
	`invitedBy` text NOT NULL,
	`inviterName` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invitedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workspaceMember` (
	`workspaceId` text NOT NULL,
	`userId` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`addedAt` integer NOT NULL,
	`addedBy` text NOT NULL,
	PRIMARY KEY(`workspaceId`, `userId`),
	FOREIGN KEY (`workspaceId`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`addedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerUserId` text NOT NULL,
	`name` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'trial' NOT NULL,
	`billingStripeCustomerId` text,
	`billingStripeSubscriptionId` text,
	`billingCurrentPeriodEnd` integer,
	`usagePlayerCount` integer DEFAULT 0 NOT NULL,
	`usageGamesThisMonth` integer DEFAULT 0 NOT NULL,
	`usageStorageUsedMB` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`ownerUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `firstName` text;--> statement-breakpoint
ALTER TABLE `user` ADD `lastName` text;--> statement-breakpoint
ALTER TABLE `user` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `user` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `user` ADD `defaultWorkspaceId` text;--> statement-breakpoint
ALTER TABLE `user` ADD `agreedToTerms` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `agreedToPrivacy` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `isParentGuardian` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `termsAgreedAt` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `privacyAgreedAt` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `verificationPinHash` text;--> statement-breakpoint
ALTER TABLE `user` ADD `updatedAt` integer;
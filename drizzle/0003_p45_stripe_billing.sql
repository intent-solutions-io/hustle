CREATE TABLE `billingLedger` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`type` text NOT NULL,
	`stripeEventId` text,
	`timestamp` integer NOT NULL,
	`statusBefore` text,
	`statusAfter` text,
	`planBefore` text,
	`planAfter` text,
	`source` text NOT NULL,
	`note` text,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `billingLedger_workspace_ts_idx` ON `billingLedger` (`workspaceId`,`timestamp`);--> statement-breakpoint
CREATE TABLE `webhookEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`receivedAt` integer NOT NULL,
	`processedAt` integer,
	`payload` text,
	`error` text
);
--> statement-breakpoint
ALTER TABLE `workspace` ADD `billingSubscriptionStatus` text;--> statement-breakpoint
ALTER TABLE `workspace` ADD `billingLastPaymentFailedAt` integer;--> statement-breakpoint
ALTER TABLE `workspace` ADD `billingCanceledAt` integer;--> statement-breakpoint
ALTER TABLE `workspace` ADD `trialEndsAt` integer;
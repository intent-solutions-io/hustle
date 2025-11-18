-- AddDefensiveStats migration
-- Adds defensive tracking statistics columns to the Game table
-- These fields are nullable and only relevant for field players (non-goalkeepers)

-- Add defensive stats columns
ALTER TABLE "Game" ADD COLUMN "tackles" INTEGER;
ALTER TABLE "Game" ADD COLUMN "interceptions" INTEGER;
ALTER TABLE "Game" ADD COLUMN "clearances" INTEGER;
ALTER TABLE "Game" ADD COLUMN "blocks" INTEGER;
ALTER TABLE "Game" ADD COLUMN "aerialDuelsWon" INTEGER;

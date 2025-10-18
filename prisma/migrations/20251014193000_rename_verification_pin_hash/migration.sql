-- Rename verificationPin column to verificationPinHash to store hashed secrets
ALTER TABLE "users" RENAME COLUMN "verificationPin" TO "verificationPinHash";

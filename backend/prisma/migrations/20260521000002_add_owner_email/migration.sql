-- AlterTable: add unique email column to CarOwner for unified login
ALTER TABLE "CarOwner" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "CarOwner_email_key" ON "CarOwner"("email");

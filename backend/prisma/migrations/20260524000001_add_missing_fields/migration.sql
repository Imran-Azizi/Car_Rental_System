-- Add missing columns to Expense (adminShare, ownerShare, receiptPhoto)
ALTER TABLE "Expense" ADD COLUMN "adminShare"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Expense" ADD COLUMN "ownerShare"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Expense" ADD COLUMN "receiptPhoto" TEXT;

-- Add missing column to Guarantor (photo2)
ALTER TABLE "Guarantor" ADD COLUMN "photo2" TEXT;

-- Add missing columns to RentalContract
ALTER TABLE "RentalContract" ADD COLUMN "driverName"       TEXT;
ALTER TABLE "RentalContract" ADD COLUMN "driverLicense"    TEXT;
ALTER TABLE "RentalContract" ADD COLUMN "driverPhone"      TEXT;
ALTER TABLE "RentalContract" ADD COLUMN "overdueCharges"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "RentalContract" ADD COLUMN "completedAt"      TIMESTAMP(3);
ALTER TABLE "RentalContract" ADD COLUMN "tazkiraDocPhoto2" TEXT;

-- Create missing OwnerNotification table
CREATE TABLE "OwnerNotification" (
    "id"        TEXT             NOT NULL,
    "ownerId"   TEXT             NOT NULL,
    "title"     TEXT             NOT NULL,
    "message"   TEXT             NOT NULL,
    "type"      TEXT             NOT NULL DEFAULT 'EXPENSE',
    "isRead"    BOOLEAN          NOT NULL DEFAULT false,
    "carId"     TEXT,
    "expenseId" TEXT,
    "amount"    DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OwnerNotification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OwnerNotification"
    ADD CONSTRAINT "OwnerNotification_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "CarOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "OwnerNotification_ownerId_idx"
    ON "OwnerNotification"("ownerId");
CREATE INDEX "OwnerNotification_ownerId_isRead_idx"
    ON "OwnerNotification"("ownerId", "isRead");
CREATE INDEX "OwnerNotification_createdAt_idx"
    ON "OwnerNotification"("createdAt");

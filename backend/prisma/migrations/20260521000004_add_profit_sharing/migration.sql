-- AlterTable: add owner/admin profit-sharing columns to RentalContract
ALTER TABLE "RentalContract" ADD COLUMN "ownerShare" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "RentalContract" ADD COLUMN "adminShare" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: add document photo fields to RentalContract
ALTER TABLE "RentalContract" ADD COLUMN "billDocPhoto" TEXT;
ALTER TABLE "RentalContract" ADD COLUMN "tazkiraDocPhoto" TEXT;

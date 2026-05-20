-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "CarOwner" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "tazkiraNumber" TEXT,
    "photo" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarOwner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "CarOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

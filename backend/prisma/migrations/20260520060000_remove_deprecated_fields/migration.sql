-- AlterTable: remove chassisNumber from Car
ALTER TABLE "Car" DROP COLUMN IF EXISTS "chassisNumber";

-- AlterTable: remove whatsappNumber and emergencyContact from Customer
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "whatsappNumber";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "emergencyContact";

-- AlterTable: remove whatsappNumber from Guarantor
ALTER TABLE "Guarantor" DROP COLUMN IF EXISTS "whatsappNumber";

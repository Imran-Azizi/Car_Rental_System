-- Add CarImage table
CREATE TABLE "CarImage" (
  "id"        TEXT         NOT NULL,
  "carId"     TEXT         NOT NULL,
  "url"       TEXT         NOT NULL,
  "order"     INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CarImage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CarImage_carId_fkey" FOREIGN KEY ("carId")
    REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CarImage_carId_idx" ON "CarImage"("carId");

-- Add photo to Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "photo" TEXT;

-- Add photo to Guarantor
ALTER TABLE "Guarantor" ADD COLUMN IF NOT EXISTS "photo" TEXT;

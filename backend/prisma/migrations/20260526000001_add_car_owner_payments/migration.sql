-- CreateTable: Payments made by admin to car owners
CREATE TABLE "CarOwnerPayment" (
    "id"            TEXT NOT NULL,
    "ownerId"       TEXT NOT NULL,
    "amount"        DOUBLE PRECISION NOT NULL,
    "paymentDate"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "notes"         TEXT,
    "receiptNumber" TEXT NOT NULL,
    "createdBy"     TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarOwnerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarOwnerPayment_receiptNumber_key" ON "CarOwnerPayment"("receiptNumber");
CREATE INDEX "CarOwnerPayment_ownerId_idx" ON "CarOwnerPayment"("ownerId");
CREATE INDEX "CarOwnerPayment_paymentDate_idx" ON "CarOwnerPayment"("paymentDate");
CREATE INDEX "CarOwnerPayment_createdAt_idx" ON "CarOwnerPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "CarOwnerPayment" ADD CONSTRAINT "CarOwnerPayment_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "CarOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

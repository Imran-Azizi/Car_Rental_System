-- DropIndex
DROP INDEX "CarImage_carId_idx";

-- CreateIndex
CREATE INDEX "Car_status_idx" ON "Car"("status");

-- CreateIndex
CREATE INDEX "Car_carName_idx" ON "Car"("carName");

-- CreateIndex
CREATE INDEX "CarOwner_fullName_idx" ON "CarOwner"("fullName");

-- CreateIndex
CREATE INDEX "CarOwner_phoneNumber_idx" ON "CarOwner"("phoneNumber");

-- CreateIndex
CREATE INDEX "Customer_fullName_idx" ON "Customer"("fullName");

-- CreateIndex
CREATE INDEX "Customer_phoneNumber_idx" ON "Customer"("phoneNumber");

-- CreateIndex
CREATE INDEX "Guarantor_fullName_idx" ON "Guarantor"("fullName");

-- CreateIndex
CREATE INDEX "Guarantor_phoneNumber_idx" ON "Guarantor"("phoneNumber");

-- CreateIndex
CREATE INDEX "Payment_contractId_idx" ON "Payment"("contractId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "RentalContract_status_idx" ON "RentalContract"("status");

-- CreateIndex
CREATE INDEX "RentalContract_createdAt_idx" ON "RentalContract"("createdAt");

-- CreateIndex
CREATE INDEX "RentalContract_customerId_idx" ON "RentalContract"("customerId");

-- CreateIndex
CREATE INDEX "RentalContract_carId_idx" ON "RentalContract"("carId");

-- CreateIndex
CREATE INDEX "RentalContract_status_remainingAmount_idx" ON "RentalContract"("status", "remainingAmount");

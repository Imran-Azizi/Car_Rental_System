-- CreateTable: Daily Expense tracking
CREATE TABLE "Expense" (
    "id"          TEXT NOT NULL,
    "fromWhom"    TEXT NOT NULL,
    "toWhom"      TEXT NOT NULL,
    "amount"      DOUBLE PRECISION NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "carId"       TEXT,
    "createdBy"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_date_idx"      ON "Expense"("date");
CREATE INDEX "Expense_carId_idx"     ON "Expense"("carId");
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_carId_fkey"
    FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

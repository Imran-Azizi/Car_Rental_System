-- CreateTable
CREATE TABLE "OrderDraft" (
    "id"        TEXT NOT NULL,
    "name"      TEXT,
    "step"      INTEGER NOT NULL DEFAULT 0,
    "formData"  JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderDraft_updatedAt_idx" ON "OrderDraft"("updatedAt");
CREATE INDEX "OrderDraft_createdAt_idx" ON "OrderDraft"("createdAt");

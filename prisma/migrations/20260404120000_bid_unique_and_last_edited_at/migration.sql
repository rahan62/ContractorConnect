-- Deduplicate bids so each (contractId, bidderId) appears at most once (keep newest by createdAt).
DELETE FROM "Bid"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "contractId", "bidderId" ORDER BY "createdAt" DESC) AS rn
    FROM "Bid"
  ) sub
  WHERE sub.rn > 1
);

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Bid_contractId_bidderId_key" ON "Bid"("contractId", "bidderId");

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "acceptedBidId" TEXT;

-- CreateTable
CREATE TABLE "ContractRating" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_acceptedBidId_key" ON "Contract"("acceptedBidId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractRating_contractId_key" ON "ContractRating"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractRating_bidId_key" ON "ContractRating"("bidId");

-- CreateIndex
CREATE INDEX "ContractRating_ratedUserId_idx" ON "ContractRating"("ratedUserId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_acceptedBidId_fkey" FOREIGN KEY ("acceptedBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRating" ADD CONSTRAINT "ContractRating_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRating" ADD CONSTRAINT "ContractRating_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRating" ADD CONSTRAINT "ContractRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRating" ADD CONSTRAINT "ContractRating_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experienceScore" INTEGER NOT NULL DEFAULT 45;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "strengthPoints" DECIMAL(14,4) NOT NULL DEFAULT 2;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyHasIso9001" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CategoryExperienceApprovalRequest" ADD COLUMN IF NOT EXISTS "declaredEvidenceValueUsd" DECIMAL(18,2);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrustStrengthConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "experienceDefault" INTEGER NOT NULL DEFAULT 45,
    "strengthPointsDefault" DECIMAL(14,4) NOT NULL DEFAULT 2,
    "pointsPerTradeCategory" DECIMAL(10,4) NOT NULL DEFAULT 2,
    "pointsIso9001" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "usdPerStrengthPoint" DECIMAL(18,4) NOT NULL DEFAULT 333333,
    "strengthTiersJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustStrengthConfig_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row if missing
INSERT INTO "TrustStrengthConfig" ("id", "experienceDefault", "strengthPointsDefault", "pointsPerTradeCategory", "pointsIso9001", "usdPerStrengthPoint", "strengthTiersJson", "updatedAt")
SELECT 1, 45, 2, 2, 1, 333333,
  '[
    {"minPoints": 0, "label": "K"},
    {"minPoints": 4, "label": "J"},
    {"minPoints": 8, "label": "I"},
    {"minPoints": 12, "label": "H"},
    {"minPoints": 16, "label": "G"},
    {"minPoints": 20, "label": "F"},
    {"minPoints": 24, "label": "E"},
    {"minPoints": 28, "label": "D"},
    {"minPoints": 32, "label": "C"},
    {"minPoints": 36, "label": "B"},
    {"minPoints": 40, "label": "A"},
    {"minPoints": 45, "label": "A+"},
    {"minPoints": 50, "label": "A++"}
  ]'::jsonb,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "TrustStrengthConfig" WHERE "id" = 1);

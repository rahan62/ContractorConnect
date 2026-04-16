-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "plateCode" INTEGER NOT NULL,
    "nameTr" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "City_plateCode_key" ON "City"("plateCode");

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "District_cityId_idx" ON "District"("cityId");

CREATE UNIQUE INDEX "District_cityId_nameTr_key" ON "District"("cityId", "nameTr");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "cityId" TEXT,
ADD COLUMN "districtId" TEXT;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CategoryExperienceApprovalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mainCategoryId" TEXT NOT NULL,
    "documentUrls" TEXT NOT NULL,
    "applicantNote" TEXT,
    "status" "ProfessionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByOperatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryExperienceApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryExperienceApprovalRequest_status_idx" ON "CategoryExperienceApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "CategoryExperienceApprovalRequest_userId_mainCategoryId_idx" ON "CategoryExperienceApprovalRequest"("userId", "mainCategoryId");

-- AddForeignKey
ALTER TABLE "CategoryExperienceApprovalRequest" ADD CONSTRAINT "CategoryExperienceApprovalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryExperienceApprovalRequest" ADD CONSTRAINT "CategoryExperienceApprovalRequest_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "SubcontractorMainCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryExperienceApprovalRequest" ADD CONSTRAINT "CategoryExperienceApprovalRequest_reviewedByOperatorId_fkey" FOREIGN KEY ("reviewedByOperatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

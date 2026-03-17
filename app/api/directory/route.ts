import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/trust-score";

type DirectoryType = "CONTRACTOR" | "SUBCONTRACTOR" | "TEAM";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "CONTRACTOR").toUpperCase() as DirectoryType;

  if (!["CONTRACTOR", "SUBCONTRACTOR", "TEAM"].includes(type)) {
    return NextResponse.json({ message: "Invalid directory type" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { userType: type },
    select: {
      id: true,
      companyName: true,
      email: true,
      phone: true,
      location: true,
      userType: true,
      isVerified: true,
      bio: true,
      logoUrl: true,
      bannerUrl: true,
      signatureAuthDocUrl: true,
      taxCertificateDocUrl: true,
      tradeRegistryGazetteDocUrl: true,
      complaints: {
        select: { id: true }
      },
      capabilities: {
        select: {
          capability: {
            select: {
              name: true
            }
          }
        }
      },
      referencesOwned: {
        where: { status: "VERIFIED" },
        select: { id: true, completedAt: true }
      },
      bids: {
        select: {
          createdAt: true,
          contract: {
            select: {
              createdAt: true
            }
          }
        }
      },
      contractsCreated: {
        where: { status: "COMPLETED" },
        select: { id: true }
      }
    },
    take: 100,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(
    users.map(user => {
      const capabilityNames = user.capabilities.map(item => item.capability.name);
      const responseHours = user.bids.length
        ? user.bids.reduce((total, bid) => {
            const diff = bid.createdAt.getTime() - bid.contract.createdAt.getTime();
            return total + Math.max(diff / (1000 * 60 * 60), 0);
          }, 0) / user.bids.length
        : null;
      const verifiedReferenceCount = user.referencesOwned.length;
      const trustedUserType =
        user.userType === "CONTRACTOR" ||
        user.userType === "SUBCONTRACTOR" ||
        user.userType === "TEAM"
          ? (user.userType as "CONTRACTOR" | "SUBCONTRACTOR" | "TEAM")
          : null;
      const trust = computeTrustScore({
        userType: trustedUserType,
        bio: user.bio,
        logoUrl: user.logoUrl,
        bannerUrl: user.bannerUrl,
        location: user.location,
        companyDocsCount: [
          user.signatureAuthDocUrl,
          user.taxCertificateDocUrl,
          user.tradeRegistryGazetteDocUrl
        ].filter(Boolean).length,
        capabilityCount: capabilityNames.length,
        verifiedReferenceCount,
        totalReferenceCount: verifiedReferenceCount,
        completedContractCount:
          user.userType === "CONTRACTOR" ? user.contractsCreated.length : verifiedReferenceCount,
        complaintCount: user.complaints.length,
        averageProposalResponseHours: responseHours,
        recentActivityCount: user.referencesOwned.filter(reference => {
          return reference.completedAt
            ? reference.completedAt >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 180)
            : false;
        }).length
      });

      return {
        id: user.id,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        userType: user.userType,
        isVerified: user.isVerified,
        trustScore: trust.score,
        trustGrade: trust.grade,
        profileCompleteness: trust.profileCompleteness,
        documentCompleteness: trust.documentCompleteness,
        referenceCount: verifiedReferenceCount,
        completedJobCount: user.userType === "CONTRACTOR" ? user.contractsCreated.length : verifiedReferenceCount,
        specialties: capabilityNames,
        notes: user.bio
      };
    })
  );
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/trust-score";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (ids.length < 2) {
    return NextResponse.json({ message: "Select at least two companies" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      userType: { in: ["SUBCONTRACTOR", "TEAM"] }
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      userType: true,
      location: true,
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
          amount: true,
          createdAt: true,
          contract: {
            select: {
              createdAt: true
            }
          }
        }
      }
    }
  });

  const result = users.map(user => {
    const specialties = user.capabilities.map(item => item.capability.name);
    const verifiedReferenceCount = user.referencesOwned.length;
    const averageResponseHours = user.bids.length
      ? user.bids.reduce((total, bid) => {
          const diff = bid.createdAt.getTime() - bid.contract.createdAt.getTime();
          return total + Math.max(diff / (1000 * 60 * 60), 0);
        }, 0) / user.bids.length
      : null;
    const averageQuoteValue = user.bids.length
      ? Math.round(user.bids.reduce((total, bid) => total + bid.amount, 0) / user.bids.length)
      : null;
    const trust = computeTrustScore({
      userType: user.userType,
      bio: user.bio,
      logoUrl: user.logoUrl,
      bannerUrl: user.bannerUrl,
      location: user.location,
      companyDocsCount: [
        user.signatureAuthDocUrl,
        user.taxCertificateDocUrl,
        user.tradeRegistryGazetteDocUrl
      ].filter(Boolean).length,
      capabilityCount: specialties.length,
      verifiedReferenceCount,
      totalReferenceCount: verifiedReferenceCount,
      completedContractCount: verifiedReferenceCount,
      complaintCount: user.complaints.length,
      averageProposalResponseHours: averageResponseHours,
      recentActivityCount: user.referencesOwned.filter(reference => {
        return reference.completedAt
          ? reference.completedAt >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 180)
          : false;
      }).length
    });

    return {
      id: user.id,
      companyName: user.companyName ?? user.email,
      location: user.location,
      isVerified: user.isVerified,
      profileCompleteness: trust.profileCompleteness,
      documentCompleteness: trust.documentCompleteness,
      referenceCount: verifiedReferenceCount,
      completedJobCount: verifiedReferenceCount,
      responseSpeedHours: averageResponseHours ? Math.round(averageResponseHours) : null,
      notes: user.bio,
      specialties,
      trustScore: trust.score,
      trustGrade: trust.grade,
      averageQuoteValue
    };
  });

  return NextResponse.json(result);
}

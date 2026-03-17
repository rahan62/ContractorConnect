import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/trust-score";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      companyName: true,
      bio: true,
      logoUrl: true,
      bannerUrl: true,
      location: true,
      email: true,
      phone: true,
      userType: true,
      isVerified: true,
      signatureAuthDocUrl: true,
      taxCertificateDocUrl: true,
      tradeRegistryGazetteDocUrl: true,
      contractsCreated: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          imageUrls: true,
          startsAt: true,
          totalDays: true,
          createdAt: true
        },
      },
      comments: {
        select: { id: true },
      },
      complaints: {
        select: { id: true }
      },
      capabilities: {
        select: {
          capability: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      referencesOwned: {
        where: { status: "VERIFIED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          completedAt: true,
          evidenceUrl: true,
          verifier: {
            select: {
              companyName: true,
              name: true,
              email: true
            }
          }
        }
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
      }
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const completedContracts = user.contractsCreated.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const activeContracts = user.contractsCreated.filter(
    (c) => c.status === "ACTIVE" || c.status === "OPEN_FOR_BIDS"
  ).length;
  const totalContracts = user.contractsCreated.length;
  const verifiedReferenceCount = user.referencesOwned.length;
  const capabilityNames = user.capabilities.map(item => item.capability.name);
  const responseHours = user.bids.length
    ? user.bids.reduce((total, bid) => {
        const diff = bid.createdAt.getTime() - bid.contract.createdAt.getTime();
        return total + Math.max(diff / (1000 * 60 * 60), 0);
      }, 0) / user.bids.length
    : null;
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
      user.userType === "CONTRACTOR" ? completedContracts : verifiedReferenceCount,
    complaintCount: user.complaints.length,
    averageProposalResponseHours: responseHours,
    recentActivityCount:
      user.referencesOwned.filter(reference => {
        return reference.completedAt
          ? reference.completedAt >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 180)
          : false;
      }).length
  });

  const result = {
    id: user.id,
    companyName: user.companyName || user.email,
    bio: user.bio,
    logoUrl: user.logoUrl,
    bannerUrl: user.bannerUrl,
    location: user.location,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    isVerified: user.isVerified,
    trustScore: trust.score,
    trustGrade: trust.grade,
    profileCompleteness: trust.profileCompleteness,
    documentCompleteness: trust.documentCompleteness,
    capabilities: capabilityNames,
    metrics: {
      completedContracts,
      activeContracts,
      totalContracts,
      references: verifiedReferenceCount,
    },
    references: user.referencesOwned.map(reference => ({
      id: reference.id,
      title: reference.title,
      description: reference.description,
      location: reference.location,
      completedAt: reference.completedAt,
      evidenceUrl: reference.evidenceUrl,
      verifierName:
        reference.verifier?.companyName ?? reference.verifier?.name ?? reference.verifier?.email ?? null
    })),
    contracts: user.contractsCreated.map(contract => ({
      id: contract.id,
      title: contract.title,
      description: contract.description,
      status: contract.status,
      imageUrl: contract.imageUrls?.split(";").filter(Boolean)[0] ?? null,
      startsAt: contract.startsAt,
      totalDays: contract.totalDays,
      createdAt: contract.createdAt
    }))
  };

  return NextResponse.json(result);
}


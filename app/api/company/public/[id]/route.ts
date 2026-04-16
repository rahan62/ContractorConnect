import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/trust-score";
import { requireSession } from "@/lib/api-auth";
import { strengthLabelFromPoints } from "@/lib/trust-strength";
import { getTrustStrengthConfig } from "@/lib/trust-strength-recalc";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

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
      },
      experienceScore: true,
      strengthPoints: true
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  let completedContracts = 0;
  let activeContracts = 0;
  let totalContracts = 0;
  if (user.userType === "CONTRACTOR") {
    const uid = user.id;
    [completedContracts, activeContracts, totalContracts] = await Promise.all([
      prisma.contract.count({ where: { contractorId: uid, status: "COMPLETED" } }),
      prisma.contract.count({
        where: { contractorId: uid, status: { in: ["ACTIVE", "OPEN_FOR_BIDS"] } }
      }),
      prisma.contract.count({ where: { contractorId: uid } })
    ]);
  }
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

  const strengthConfig = await getTrustStrengthConfig();
  const isSubOrTeam = user.userType === "SUBCONTRACTOR" || user.userType === "TEAM";
  const strengthLabel = isSubOrTeam
    ? strengthLabelFromPoints(Number(user.strengthPoints), strengthConfig.strengthTiersJson)
    : null;

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
    experienceScore: isSubOrTeam ? user.experienceScore : null,
    strengthLabel,
    trustScore: isSubOrTeam ? user.experienceScore : trust.score,
    trustGrade: isSubOrTeam ? strengthLabel : trust.grade,
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
    }))
  };

  return NextResponse.json(result);
}


import { computeTrustScore } from "@/lib/trust-score";

/** Prisma user shape compatible with directory/trust scoring */
export type UserRecordForTrust = {
  userType: string | null;
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  location: string | null;
  signatureAuthDocUrl: string | null;
  taxCertificateDocUrl: string | null;
  tradeRegistryGazetteDocUrl: string | null;
  complaints: { id: string }[];
  capabilities: { capability: { name: string } }[];
  referencesOwned: { id: string; completedAt: Date | null }[];
  bids: { createdAt: Date; contract: { createdAt: Date } }[];
  contractsCreated: { id: string }[];
};

export function computeTrustFromUserRecord(user: UserRecordForTrust) {
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

  return computeTrustScore({
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
}

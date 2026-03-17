interface TrustScoreInput {
  userType: "SUBCONTRACTOR" | "TEAM" | "CONTRACTOR" | null | undefined;
  bio?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  companyDocsCount: number;
  capabilityCount: number;
  verifiedReferenceCount: number;
  totalReferenceCount: number;
  completedContractCount: number;
  complaintCount: number;
  averageProposalResponseHours?: number | null;
  recentActivityCount: number;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function computeProfileCompleteness(input: TrustScoreInput) {
  const score =
    (input.bio ? 30 : 0) +
    (input.logoUrl ? 20 : 0) +
    (input.bannerUrl ? 10 : 0) +
    (input.location ? 20 : 0) +
    (input.capabilityCount > 0 ? 20 : 0);

  return clamp(score);
}

export function computeDocumentCompleteness(input: TrustScoreInput) {
  return clamp((input.companyDocsCount / 3) * 100);
}

export function computeTrustScore(input: TrustScoreInput) {
  if (input.userType !== "SUBCONTRACTOR" && input.userType !== "TEAM") {
    return {
      score: null,
      grade: null,
      profileCompleteness: computeProfileCompleteness(input),
      documentCompleteness: computeDocumentCompleteness(input)
    };
  }

  const profileCompleteness = computeProfileCompleteness(input);
  const documentCompleteness = computeDocumentCompleteness(input);
  const completedJobsScore = Math.min(input.completedContractCount * 8, 20);
  const referenceAuthenticityScore =
    input.totalReferenceCount > 0 ? (input.verifiedReferenceCount / input.totalReferenceCount) * 15 : 0;
  const proposalResponseScore =
    input.averageProposalResponseHours == null
      ? 6
      : input.averageProposalResponseHours <= 24
        ? 10
        : input.averageProposalResponseHours <= 72
          ? 7
          : 3;
  const regionalActivityScore = input.location ? Math.min(input.recentActivityCount * 4, 10) : 0;
  const disputeScore = Math.max(0, 10 - input.complaintCount * 3);
  const specializationScore = input.capabilityCount > 0 ? Math.min(input.capabilityCount * 2, 10) : 0;

  const rawScore =
    profileCompleteness * 0.15 +
    documentCompleteness * 0.15 +
    completedJobsScore +
    referenceAuthenticityScore +
    proposalResponseScore +
    regionalActivityScore +
    disputeScore +
    specializationScore;

  const score = clamp(rawScore);

  return {
    score,
    grade: score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E",
    profileCompleteness,
    documentCompleteness
  };
}

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  averageRatingToExperience,
  parseStrengthTiersJson,
  resolveStrengthLabel
} from "@/lib/trust-strength";

export async function getTrustStrengthConfig() {
  let row = await prisma.trustStrengthConfig.findUnique({ where: { id: 1 } });
  if (!row) {
    row = await prisma.trustStrengthConfig.create({
      data: {
        id: 1,
        experienceDefault: 45,
        strengthPointsDefault: new Prisma.Decimal(2),
        pointsPerTradeCategory: new Prisma.Decimal(2),
        pointsIso9001: new Prisma.Decimal(1),
        usdPerStrengthPoint: new Prisma.Decimal(333333)
      }
    });
  }
  return row;
}

/** Recompute `experienceScore` from all contractor ratings received (1–5 stars → 0–100). */
export async function recalculateExperienceScoreForUser(userId: string): Promise<number> {
  const config = await getTrustStrengthConfig();
  const agg = await prisma.contractRating.aggregate({
    where: { ratedUserId: userId },
    _avg: { rating: true },
    _count: { _all: true }
  });
  const count = agg._count._all;
  if (count === 0 || agg._avg.rating == null) {
    await prisma.user.update({
      where: { id: userId },
      data: { experienceScore: config.experienceDefault }
    });
    return config.experienceDefault;
  }
  const exp = averageRatingToExperience(agg._avg.rating);
  await prisma.user.update({
    where: { id: userId },
    data: { experienceScore: exp }
  });
  return exp;
}

/** Sum strength from approved trade rows, ISO flag, and approved category evidence USD. */
export async function recalculateStrengthPointsForUser(userId: string): Promise<{
  strengthPoints: number;
  strengthLabel: string;
}> {
  const config = await getTrustStrengthConfig();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyHasIso9001: true, userType: true }
  });
  if (!user) {
    return { strengthPoints: 0, strengthLabel: "?" };
  }

  const [categoryCount, evidenceSum] = await Promise.all([
    prisma.userSubcontractorMainCategory.count({ where: { userId } }),
    prisma.categoryExperienceApprovalRequest.aggregate({
      where: { userId, status: "APPROVED" },
      _sum: { declaredEvidenceValueUsd: true }
    })
  ]);

  const totalUsd = Number(evidenceSum._sum.declaredEvidenceValueUsd ?? 0);
  const usdPer = Number(config.usdPerStrengthPoint);
  const evidencePts = usdPer > 0 ? totalUsd / usdPer : 0;
  const catPts = Number(config.pointsPerTradeCategory) * categoryCount;
  const isoPts = user.companyHasIso9001 ? Number(config.pointsIso9001) : 0;
  const points = catPts + isoPts + evidencePts;

  const tiers = parseStrengthTiersJson(config.strengthTiersJson);
  const strengthLabel = resolveStrengthLabel(points, tiers);

  await prisma.user.update({
    where: { id: userId },
    data: { strengthPoints: new Prisma.Decimal(points) }
  });

  return { strengthPoints: points, strengthLabel };
}

export async function refreshTrustScoresForSubcontractorUser(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true }
  });
  if (!u || (u.userType !== "SUBCONTRACTOR" && u.userType !== "TEAM")) {
    return null;
  }
  const [experienceScore, strength] = await Promise.all([
    recalculateExperienceScoreForUser(userId),
    recalculateStrengthPointsForUser(userId)
  ]);
  return { experienceScore, ...strength };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeBidForResponse } from "@/lib/bid-display";
import { computeTrustFromUserRecord } from "@/lib/trust-user-snapshot";

export const dynamic = "force-dynamic";

const userSelectForTrust = {
  userType: true,
  bio: true,
  logoUrl: true,
  bannerUrl: true,
  location: true,
  signatureAuthDocUrl: true,
  taxCertificateDocUrl: true,
  tradeRegistryGazetteDocUrl: true,
  complaints: { select: { id: true } },
  capabilities: {
    select: {
      capability: { select: { name: true } }
    }
  },
  referencesOwned: {
    where: { status: "VERIFIED" as const },
    select: { id: true, completedAt: true }
  },
  bids: {
    select: {
      createdAt: true,
      contract: { select: { createdAt: true } }
    }
  },
  contractsCreated: {
    where: { status: "COMPLETED" as const },
    select: { id: true }
  }
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true, companyName: true }
  });

  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (!user.userType) {
    return NextResponse.json({
      userType: null,
      companyName: user.companyName,
      payload: null
    });
  }

  const { id: userId, userType } = user;

  if (userType === "CONTRACTOR") {
    const [
      totalContracts,
      totalUrgentJobs,
      budgetSum,
      settledBidRows,
      contractsForOffers
    ] = await Promise.all([
      prisma.contract.count({
        where: { contractorId: userId, isUrgent: false }
      }),
      prisma.contract.count({
        where: { contractorId: userId, isUrgent: true }
      }),
      prisma.contract.aggregate({
        where: {
          contractorId: userId,
          isUrgent: false,
          budget: { not: null }
        },
        _sum: { budget: true }
      }),
      prisma.bid.findMany({
        where: {
          status: "ACCEPTED",
          contract: {
            contractorId: userId,
            status: "COMPLETED"
          },
          bidder: { userType: "SUBCONTRACTOR" }
        },
        select: { bidderId: true },
        distinct: ["bidderId"]
      }),
      prisma.contract.findMany({
        where: { contractorId: userId, isUrgent: false },
        select: {
          id: true,
          title: true,
          status: true,
          bids: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              amount: true,
              currency: true,
              message: true,
              createdAt: true,
              bidder: {
                select: { companyName: true, name: true, email: true }
              }
            }
          }
        }
      })
    ]);

    const settledSubcontractorCount = settledBidRows.length;

    let avgPartnerTrustScore: number | null = null;
    const partnerIds = settledBidRows.map(r => r.bidderId).filter(Boolean);
    if (partnerIds.length > 0) {
      const partners = await prisma.user.findMany({
        where: { id: { in: partnerIds }, userType: "SUBCONTRACTOR" },
        select: userSelectForTrust
      });
      const scores = partners
        .map(p => computeTrustFromUserRecord(p as Parameters<typeof computeTrustFromUserRecord>[0]).score)
        .filter((s): s is number => s != null);
      if (scores.length > 0) {
        avgPartnerTrustScore = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
      }
    }

    const withLatestBid = contractsForOffers
      .filter(c => c.bids.length > 0)
      .map(c => {
        const b = c.bids[0];
        const norm = normalizeBidForResponse({
          amount: b.amount,
          currency: b.currency,
          message: b.message
        });
        return {
          contractId: c.id,
          title: c.title,
          status: c.status,
          latestBidAt: b.createdAt.toISOString(),
          latestBidAmount: norm.amount,
          latestBidCurrency: norm.currency,
          bidderName: b.bidder.companyName ?? b.bidder.name ?? b.bidder.email
        };
      })
      .sort((a, b) => new Date(b.latestBidAt).getTime() - new Date(a.latestBidAt).getTime())
      .slice(0, 8);

    return NextResponse.json({
      userType: "CONTRACTOR",
      companyName: user.companyName,
      payload: {
        metrics: {
          totalContracts,
          totalUrgentJobs,
          totalContractBudgetSum: budgetSum._sum.budget ?? 0,
          settledSubcontractorCount,
          avgPartnerTrustScore
        },
        latestOfferContracts: withLatestBid
      }
    });
  }

  if (userType === "SUBCONTRACTOR") {
    const [
      completedContracts,
      pendingBidsOnOpen,
      teamMembershipRows,
      verifiedRefs
    ] = await Promise.all([
      prisma.contract.count({
        where: {
          status: "COMPLETED",
          acceptedBid: { bidderId: userId }
        }
      }),
      prisma.bid.count({
        where: {
          bidderId: userId,
          status: "PENDING",
          contract: { status: "OPEN_FOR_BIDS" }
        }
      }),
      prisma.teamMember.groupBy({
        by: ["teamId"],
        where: { userId }
      }),
      prisma.companyReference.count({
        where: { ownerId: userId, status: "VERIFIED" }
      })
    ]);

    const activeContracts = await prisma.contract.count({
      where: {
        status: "ACTIVE",
        acceptedBid: { bidderId: userId }
      }
    });

    return NextResponse.json({
      userType: "SUBCONTRACTOR",
      companyName: user.companyName,
      payload: {
        metrics: {
          completedContracts,
          activeContracts,
          pendingBidsOnOpen,
          teamsYouBelongTo: teamMembershipRows.length,
          verifiedReferences: verifiedRefs
        }
      }
    });
  }

  if (userType === "TEAM") {
    const teams = await prisma.team.findMany({
      where: { leaderId: userId },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } }
      }
    });

    const teamIds = teams.map(t => t.id);
    const memberSlots =
      teamIds.length > 0
        ? await prisma.teamMember.count({
            where: { teamId: { in: teamIds } }
          })
        : 0;

    const [completedJobs, pendingBidsOnOpen, activeJobs] = await Promise.all([
      prisma.contract.count({
        where: {
          status: "COMPLETED",
          acceptedBid: { bidderId: userId }
        }
      }),
      prisma.bid.count({
        where: {
          bidderId: userId,
          status: "PENDING",
          contract: { status: "OPEN_FOR_BIDS" }
        }
      }),
      prisma.contract.count({
        where: {
          status: "ACTIVE",
          acceptedBid: { bidderId: userId }
        }
      })
    ]);

    const urgentCompleted = await prisma.contract.count({
      where: {
        isUrgent: true,
        status: "COMPLETED",
        acceptedBid: { bidderId: userId }
      }
    });

    const primaryTeam = teams[0] ?? null;

    return NextResponse.json({
      userType: "TEAM",
      companyName: user.companyName,
      payload: {
        metrics: {
          completedJobs,
          urgentJobsCompleted: urgentCompleted,
          activeJobs,
          pendingBidsOnOpen,
          teamsYouLead: teams.length,
          rosterMembers: memberSlots,
          teamName: primaryTeam?.name ?? null
        }
      }
    });
  }

  return NextResponse.json({
    userType,
    companyName: user.companyName,
    payload: null
  });
}

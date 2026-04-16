import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeBidForResponse } from "@/lib/bid-display";
import { userMayViewContractMine } from "@/lib/contractor-mine-access";
import { withContractLocationSelectFallback } from "@/lib/contract-location-query-fallback";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true }
  });

  if (!user || !(await userMayViewContractMine(prisma, user))) {
    return NextResponse.json({ message: "Only contractors can access" }, { status: 403 });
  }

  const mineSelectCore = {
    id: true,
    title: true,
    description: true,
    status: true,
    acceptedBidId: true,
    imageUrls: true,
    startsAt: true,
    totalDays: true,
    createdAt: true,
    capabilities: {
      select: {
        capability: {
          select: { id: true, name: true }
        }
      }
    },
    bids: {
      orderBy: { createdAt: "desc" as const },
      take: 50,
      select: {
        id: true,
        amount: true,
        currency: true,
        message: true,
        documentUrl: true,
        status: true,
        createdAt: true,
        bidder: {
          select: {
            companyName: true,
            name: true,
            email: true
          }
        }
      }
    }
  } as const;

  const contracts = await withContractLocationSelectFallback(
    () =>
      prisma.contract.findMany({
        where: { contractorId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          ...mineSelectCore,
          city: {
            select: { id: true, plateCode: true, nameTr: true }
          },
          district: {
            select: { id: true, nameTr: true }
          }
        }
      }),
    () =>
      prisma.contract.findMany({
        where: { contractorId: user.id },
        orderBy: { createdAt: "desc" },
        select: mineSelectCore
      })
  );

  return NextResponse.json(
    contracts.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      acceptedBidId: c.acceptedBidId,
      imageUrls: c.imageUrls,
      startsAt: c.startsAt,
      totalDays: c.totalDays,
      createdAt: c.createdAt,
      city: "city" in c ? c.city : null,
      district: "district" in c ? c.district : null,
      capabilities: c.capabilities,
      bids: c.bids.map(b => {
        const norm = normalizeBidForResponse(b);
        return {
          id: b.id,
          bidderName: b.bidder.companyName ?? b.bidder.name ?? b.bidder.email,
          amount: norm.amount,
          currency: norm.currency,
          message: norm.message,
          documentUrl: b.documentUrl,
          status: b.status,
          createdAt: b.createdAt
        };
      })
    }))
  );
}

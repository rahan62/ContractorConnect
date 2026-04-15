import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeBidForResponse } from "@/lib/bid-display";

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

  if (!user || user.userType !== "CONTRACTOR") {
    return NextResponse.json({ message: "Only contractors can access" }, { status: 403 });
  }

  const contracts = await prisma.contract.findMany({
    where: { contractorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
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
        orderBy: { createdAt: "desc" },
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
    }
  });

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

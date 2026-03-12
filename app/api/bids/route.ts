import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (!user || user.userType !== "SUBCONTRACTOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const bids = await prisma.bid.findMany({
    where: { bidderId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      createdAt: true,
      contract: {
        select: {
          id: true,
          title: true,
          status: true,
          startsAt: true,
          totalDays: true,
          contractor: {
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
    bids.map(bid => ({
      id: bid.id,
      amount: bid.amount,
      message: bid.currency ?? null,
      createdAt: bid.createdAt,
      contract: {
        id: bid.contract.id,
        title: bid.contract.title,
        status: bid.contract.status,
        startsAt: bid.contract.startsAt,
        totalDays: bid.contract.totalDays,
        contractorName:
          bid.contract.contractor?.companyName ??
          bid.contract.contractor?.name ??
          bid.contract.contractor?.email ??
          "-"
      }
    }))
  );
}

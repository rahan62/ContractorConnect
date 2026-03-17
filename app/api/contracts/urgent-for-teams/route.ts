import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// List urgent contracts that are meant for teams – only visible to team accounts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      userType: true
    }
  });

  if (!user || user.userType !== "TEAM") {
    return NextResponse.json({ message: "Only teams can view urgent jobs for teams" }, { status: 403 });
  }

  const contracts = await prisma.contract.findMany({
    where: {
      isUrgent: true
    },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      totalDays: true,
      createdAt: true,
      contractor: {
        select: {
          id: true,
          companyName: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json(contracts);
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// List urgent jobs created by the logged-in contractor
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

  if (!user || user.userType !== "CONTRACTOR") {
    return NextResponse.json({ message: "Only contractors can view their urgent jobs" }, { status: 403 });
  }

  const contracts = await prisma.contract.findMany({
    where: {
      isUrgent: true,
      contractorId: user.id
    },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      totalDays: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json(contracts);
}


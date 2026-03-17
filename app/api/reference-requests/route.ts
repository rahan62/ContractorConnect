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

  if (!user || !user.userType || !["CONTRACTOR", "SUBCONTRACTOR"].includes(user.userType)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.companyReference.findMany({
    where: {
      verifierId: user.id,
      status: "PENDING"
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      evidenceUrl: true,
      startsAt: true,
      completedAt: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          companyName: true,
          name: true,
          email: true,
          userType: true
        }
      }
    }
  });

  return NextResponse.json(
    requests.map(request => ({
      ...request,
      ownerName: request.owner.companyName ?? request.owner.name ?? request.owner.email
    }))
  );
}

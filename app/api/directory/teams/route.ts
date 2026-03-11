import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      leaderId: true,
      leader: {
        select: {
          companyName: true,
          name: true
        }
      }
    },
    take: 100,
    orderBy: { createdAt: "desc" }
  });

  const result = teams.map(team => ({
    id: team.id,
    name: team.name,
    leaderId: team.leaderId,
    leaderName: team.leader.companyName || team.leader.name || null
  }));

  return NextResponse.json(result);
}


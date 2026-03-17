import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// List active team availability posts for contractors and subcontractors to browse
export async function GET() {
  const posts = await prisma.teamAvailabilityPost.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      availableFrom: true,
      availableTo: true,
      totalDays: true,
      team: {
        select: {
          id: true,
          name: true,
          leader: {
            select: {
              id: true,
              companyName: true,
              name: true
            }
          }
        }
      },
      profession: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return NextResponse.json(posts);
}

// Create a new availability post – only team leaders can create these
export async function POST(request: Request) {
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
    return NextResponse.json({ message: "Only team accounts can create availability posts" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, professionId, availableFrom, availableTo, totalDays } = body as {
    title: string;
    description?: string;
    professionId: string;
    availableFrom: string;
    availableTo: string;
    totalDays: number;
  };

  if (!title || !professionId || !availableFrom || !availableTo || !totalDays) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  // Find the team led by this user
  const team = await prisma.team.findFirst({
    where: { leaderId: user.id },
    select: { id: true }
  });

  if (!team) {
    return NextResponse.json(
      { message: "You must be a team leader to create availability posts" },
      { status: 403 }
    );
  }

  const post = await prisma.teamAvailabilityPost.create({
    data: {
      teamId: team.id,
      title,
      description: description ?? null,
      professionId,
      availableFrom: new Date(availableFrom),
      availableTo: new Date(availableTo),
      totalDays
    }
  });

  return NextResponse.json(post, { status: 201 });
}


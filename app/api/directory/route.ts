import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DirectoryType = "CONTRACTOR" | "SUBCONTRACTOR" | "TEAM";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "CONTRACTOR").toUpperCase() as DirectoryType;

  if (!["CONTRACTOR", "SUBCONTRACTOR", "TEAM"].includes(type)) {
    return NextResponse.json({ message: "Invalid directory type" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { userType: type },
    select: {
      id: true,
      companyName: true,
      email: true,
      phone: true,
      userType: true,
      isVerified: true
    },
    take: 100,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(users);
}


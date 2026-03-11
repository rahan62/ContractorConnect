import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      companyName: true,
      bio: true,
      logoUrl: true,
      bannerUrl: true,
      email: true,
      phone: true,
      userType: true,
      isVerified: true,
      contractsCreated: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          imageUrls: true,
          startsAt: true,
          totalDays: true,
          createdAt: true
        },
      },
      comments: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const completedContracts = user.contractsCreated.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const activeContracts = user.contractsCreated.filter(
    (c) => c.status === "ACTIVE" || c.status === "OPEN_FOR_BIDS"
  ).length;
  const totalContracts = user.contractsCreated.length;

  const result = {
    id: user.id,
    companyName: user.companyName || user.email,
    bio: user.bio,
    logoUrl: user.logoUrl,
    bannerUrl: user.bannerUrl,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    isVerified: user.isVerified,
    metrics: {
      completedContracts,
      activeContracts,
      totalContracts,
      references: user.comments.length,
    },
    contracts: user.contractsCreated.map(contract => ({
      id: contract.id,
      title: contract.title,
      description: contract.description,
      status: contract.status,
      imageUrl: contract.imageUrls?.split(";").filter(Boolean)[0] ?? null,
      startsAt: contract.startsAt,
      totalDays: contract.totalDays,
      createdAt: contract.createdAt
    }))
  };

  return NextResponse.json(result);
}


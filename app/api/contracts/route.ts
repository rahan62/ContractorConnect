import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      imageUrls: true,
      startsAt: true,
      totalDays: true,
      contractorId: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json(contracts);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      userType: true,
      signatureAuthDocUrl: true,
      taxCertificateDocUrl: true,
      tradeRegistryGazetteDocUrl: true
    }
  });

  if (!user || user.userType !== "CONTRACTOR") {
    return NextResponse.json({ message: "Only contractors can create contracts" }, { status: 403 });
  }

  // Require mandatory company documents before allowing contract creation
  if (
    !user.signatureAuthDocUrl ||
    !user.taxCertificateDocUrl ||
    !user.tradeRegistryGazetteDocUrl
  ) {
    return NextResponse.json(
      {
        message:
          "Company documents are missing. Please upload signature authorization, tax certificate and trade registry gazette before creating contracts."
      },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { title, description, dwgFiles, imageUrls, startsAt, totalDays } = body as {
    title: string;
    description: string;
    dwgFiles?: string[];
    imageUrls?: string[];
    startsAt?: string;
    totalDays?: number;
  };

  if (!title || !description) {
    return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
  }

  const contract = await prisma.contract.create({
    data: {
      title,
      description,
      contractorId: user.id,
      startsAt: startsAt ? new Date(startsAt) : null,
      totalDays: totalDays ?? null,
      dwgFiles: dwgFiles?.join(";") ?? null,
      imageUrls: imageUrls?.join(";") ?? null
    }
  });

  return NextResponse.json(contract, { status: 201 });
}


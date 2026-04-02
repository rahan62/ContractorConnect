import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getMonetizationConfig } from "@/lib/monetization";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  // Regular contracts list excludes urgent jobs to keep "Contracts" and "Urgent jobs" as separate sections
  const contracts = await prisma.contract.findMany({
    where: { isUrgent: false },
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
      tokenBalance: true,
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
  const {
    title,
    description,
    dwgFiles,
    imageUrls,
    startsAt,
    totalDays,
    capabilityIds,
    requiredSubcontractorMainCategoryIds,
    isUrgent
  } = body as {
    title: string;
    description: string;
    dwgFiles?: string[];
    imageUrls?: string[];
    startsAt?: string;
    totalDays?: number;
    capabilityIds?: string[];
    requiredSubcontractorMainCategoryIds?: string[];
    isUrgent?: boolean;
  };

  let requiredCategoryRows: { mainCategoryId: string }[] | undefined;
  if (requiredSubcontractorMainCategoryIds?.length) {
    const uniq = [...new Set(requiredSubcontractorMainCategoryIds)];
    const found = await prisma.subcontractorMainCategory.findMany({
      where: { id: { in: uniq } },
      select: { id: true }
    });
    if (found.length !== uniq.length) {
      return NextResponse.json({ message: "One or more trade category IDs are invalid" }, { status: 400 });
    }
    requiredCategoryRows = uniq.map(mainCategoryId => ({ mainCategoryId }));
  }

  if (!title || !description) {
    return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
  }

  const monetization = await getMonetizationConfig();
  const cost = Boolean(isUrgent) ? monetization.tokensPerUrgentJob : monetization.tokensPerContract;

  if ((user.tokenBalance ?? 0) < cost) {
    return NextResponse.json(
      { message: "Insufficient tokens to create this job. Please contact support to receive more tokens." },
      { status: 400 }
    );
  }

  try {
    const contract = await prisma.$transaction(async tx => {
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { tokenBalance: true }
      });

      if (!freshUser || freshUser.tokenBalance < cost) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      const created = await tx.contract.create({
        data: {
          title,
          description,
          contractorId: user.id,
          status: "OPEN_FOR_BIDS",
          isUrgent: Boolean(isUrgent),
          startsAt: startsAt ? new Date(startsAt) : null,
          totalDays: totalDays ?? null,
          dwgFiles: dwgFiles?.join(";") ?? null,
          imageUrls: imageUrls?.join(";") ?? null,
          capabilities: capabilityIds?.length
            ? {
                create: capabilityIds.map(capabilityId => ({
                  capabilityId
                }))
              }
            : undefined,
          requiredSubcontractorMainCategories: requiredCategoryRows?.length
            ? { create: requiredCategoryRows }
            : undefined
        },
        include: {
          capabilities: {
            select: {
              capability: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          tokenBalance: {
            decrement: cost
          }
        }
      });

      return created;
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (err: any) {
    if (err instanceof Error && err.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { message: "Insufficient tokens to create this job. Please contact support to receive more tokens." },
        { status: 400 }
      );
    }
    throw err;
  }
}


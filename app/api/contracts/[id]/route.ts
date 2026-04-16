import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeBidForResponse } from "@/lib/bid-display";
import { getBidEditEligibility } from "@/lib/bid-edit";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const session = auth.session;

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      contractorId: true,
      acceptedBidId: true,
      dwgFiles: true,
      documentUrls: true,
      imageUrls: true,
      startsAt: true,
      totalDays: true,
      createdAt: true,
      updatedAt: true,
      capabilities: {
        select: {
          capability: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      requiredSubcontractorMainCategories: {
        select: {
          mainCategory: {
            select: {
              id: true,
              slug: true,
              nameEn: true,
              nameTr: true
            }
          }
        }
      }
    }
  });
  if (!contract) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, userType: true }
      })
    : null;

  const canViewBidDetails = currentUser?.id === contract.contractorId;

  let myBid: {
    id: string;
    amount: number;
    currency: string;
    message: string | null;
    documentUrl: string | null;
    canEdit: boolean;
    nextEditAvailableAt: string | null;
  } | null = null;

  if (
    currentUser &&
    (currentUser.userType === "SUBCONTRACTOR" || currentUser.userType === "TEAM")
  ) {
    const row = await prisma.bid.findUnique({
      where: {
        contractId_bidderId: { contractId: params.id, bidderId: currentUser.id }
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        message: true,
        documentUrl: true,
        lastEditedAt: true,
        status: true
      }
    });
    if (row && row.status === "PENDING" && contract.status === "OPEN_FOR_BIDS") {
      const norm = normalizeBidForResponse(row);
      const elig = getBidEditEligibility(row.lastEditedAt);
      myBid = {
        id: row.id,
        amount: norm.amount,
        currency: norm.currency,
        message: norm.message,
        documentUrl: row.documentUrl ?? null,
        canEdit: elig.canEdit,
        nextEditAvailableAt: elig.nextEditAvailableAt
      };
    }
  }

  const [bids, comments] = await Promise.all([
    prisma.bid.findMany({
      where: { contractId: params.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        message: true,
        documentUrl: true,
        status: true,
        bidderId: true,
        bidder: {
          select: {
            companyName: true,
            name: true,
            email: true
          }
        },
        createdAt: true
      }
    }),
    prisma.comment.findMany({
      where: { contractId: params.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true
      }
    })
  ]);

  return NextResponse.json({
    contract,
    canViewBidDetails,
    myBid,
    bids: bids.map(bid => {
      const norm = normalizeBidForResponse(bid);
      if (!canViewBidDetails) {
        return {
          id: bid.id,
          bidderName: bid.bidder.companyName ?? bid.bidder.name ?? bid.bidder.email,
          amount: null,
          currency: null,
          message: null,
          documentUrl: null,
          status: bid.status,
          createdAt: bid.createdAt
        };
      }
      return {
        id: bid.id,
        bidderName: bid.bidder.companyName ?? bid.bidder.name ?? bid.bidder.email,
        amount: norm.amount,
        currency: norm.currency,
        message: norm.message,
        documentUrl: bid.documentUrl ?? null,
        status: bid.status,
        createdAt: bid.createdAt
      };
    }),
    comments: comments.map(comment => ({
      id: comment.id,
      body: comment.content
    })),
    downloadableFiles: [
      ...(contract.dwgFiles ? contract.dwgFiles.split(";").filter(Boolean) : []),
      ...(contract.documentUrls ? contract.documentUrls.split(";").filter(Boolean) : [])
    ],
    imageUrls: contract.imageUrls
      ? contract.imageUrls.split(";").filter(Boolean)
      : []
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true }
  });

  const existing = await prisma.contract.findUnique({
    where: { id: params.id },
    select: { contractorId: true, dwgFiles: true, documentUrls: true }
  });

  if (!currentUser || !existing || currentUser.userType !== "CONTRACTOR" || existing.contractorId !== currentUser.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, startsAt, totalDays, status, appendDwgUrls, appendDocumentUrls } = body as {
    title?: string;
    description?: string;
    startsAt?: string | null;
    totalDays?: number | null;
    status?: string;
    appendDwgUrls?: string[];
    appendDocumentUrls?: string[];
  };

  const mergePaths = (current: string | null, additions: string[] | undefined) => {
    if (!additions?.length) return undefined;
    const base = current ? current.split(";").filter(Boolean) : [];
    const merged = [...base, ...additions];
    return merged.length ? merged.join(";") : null;
  };

  const nextDwg = mergePaths(existing.dwgFiles, appendDwgUrls);
  const nextDocs = mergePaths(existing.documentUrls, appendDocumentUrls);

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: {
      title,
      description,
      startsAt: startsAt ? new Date(startsAt) : startsAt === null ? null : undefined,
      totalDays,
      status: status as any,
      ...(nextDwg !== undefined ? { dwgFiles: nextDwg } : {}),
      ...(nextDocs !== undefined ? { documentUrls: nextDocs } : {})
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true }
  });

  const existing = await prisma.contract.findUnique({
    where: { id: params.id },
    select: { contractorId: true }
  });

  if (!currentUser || !existing || currentUser.userType !== "CONTRACTOR" || existing.contractorId !== currentUser.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await prisma.contract.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ ok: true });
}


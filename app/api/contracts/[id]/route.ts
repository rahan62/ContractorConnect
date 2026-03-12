import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      contractorId: true,
      dwgFiles: true,
      imageUrls: true,
      startsAt: true,
      totalDays: true,
      createdAt: true,
      updatedAt: true
    }
  });
  if (!contract) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
    : null;

  const canViewBidDetails = currentUser?.id === contract.contractorId;

  const [bids, comments] = await Promise.all([
    prisma.bid.findMany({
      where: { contractId: params.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        documentUrl: true,
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
    bids: bids.map(bid => ({
      id: bid.id,
      bidderName: bid.bidder.companyName ?? bid.bidder.name ?? bid.bidder.email,
      amount: canViewBidDetails ? bid.amount : null,
      message: canViewBidDetails ? bid.currency ?? null : null,
      documentUrl: canViewBidDetails ? bid.documentUrl ?? null : null
    })),
    comments: comments.map(comment => ({
      id: comment.id,
      body: comment.content
    })),
    downloadableFiles: contract.dwgFiles
      ? contract.dwgFiles.split(";").filter(Boolean)
      : [],
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
    select: { contractorId: true }
  });

  if (!currentUser || !existing || currentUser.userType !== "CONTRACTOR" || existing.contractorId !== currentUser.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, startsAt, totalDays, status } = body as {
    title?: string;
    description?: string;
    startsAt?: string | null;
    totalDays?: number | null;
    status?: string;
  };

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: {
      title,
      description,
      startsAt: startsAt ? new Date(startsAt) : startsAt === null ? null : undefined,
      totalDays,
      status: status as any
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


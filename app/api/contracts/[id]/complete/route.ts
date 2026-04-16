import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshTrustScoresForSubcontractorUser } from "@/lib/trust-strength-recalc";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true }
  });

  if (!currentUser || currentUser.userType !== "CONTRACTOR") {
    return NextResponse.json({ message: "Only contractors can complete contracts" }, { status: 403 });
  }

  const body = await request.json();
  const { rating, comment } = body as { rating: number; comment?: string };

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json(
      { message: "Rating is required and must be between 1 and 5" },
      { status: 400 }
    );
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: {
      contractorId: true,
      status: true,
      acceptedBidId: true,
      rating: { select: { id: true } }
    }
  });

  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }

  if (contract.contractorId !== currentUser.id) {
    return NextResponse.json({ message: "Only the contract owner can complete contracts" }, { status: 403 });
  }

  if (contract.status !== "ACTIVE") {
    return NextResponse.json(
      { message: "Contract can only be completed when it is active" },
      { status: 400 }
    );
  }

  if (!contract.acceptedBidId) {
    return NextResponse.json({ message: "Contract has no accepted bid" }, { status: 400 });
  }

  if (contract.rating) {
    return NextResponse.json({ message: "Contract has already been completed and rated" }, { status: 400 });
  }

  const acceptedBid = await prisma.bid.findUnique({
    where: { id: contract.acceptedBidId },
    select: { bidderId: true }
  });

  if (!acceptedBid) {
    return NextResponse.json({ message: "Accepted bid not found" }, { status: 500 });
  }

  await prisma.$transaction(async tx => {
    await tx.contractRating.create({
      data: {
        contractId: params.id,
        bidId: contract.acceptedBidId!,
        raterId: currentUser.id,
        ratedUserId: acceptedBid.bidderId,
        rating,
        comment: comment?.trim() || null
      }
    });
    await tx.contract.update({
      where: { id: params.id },
      data: { status: "COMPLETED" }
    });
  });

  void refreshTrustScoresForSubcontractorUser(acceptedBid.bidderId).catch(err =>
    console.error("[complete contract] trust score refresh", err)
  );

  return NextResponse.json({ ok: true });
}

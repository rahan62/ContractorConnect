import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    return NextResponse.json({ message: "Only contractors can accept bids" }, { status: 403 });
  }

  const body = await request.json();
  const { bidId } = body as { bidId: string };

  if (!bidId) {
    return NextResponse.json({ message: "bidId is required" }, { status: 400 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: {
      contractorId: true,
      status: true,
      acceptedBidId: true
    }
  });

  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }

  if (contract.contractorId !== currentUser.id) {
    return NextResponse.json({ message: "Only the contract owner can accept bids" }, { status: 403 });
  }

  if (contract.status !== "OPEN_FOR_BIDS") {
    return NextResponse.json(
      { message: "Bid can only be accepted when contract is open for bids" },
      { status: 400 }
    );
  }

  if (contract.acceptedBidId) {
    return NextResponse.json({ message: "A bid has already been accepted" }, { status: 400 });
  }

  const bid = await prisma.bid.findFirst({
    where: { id: bidId, contractId: params.id },
    select: { id: true, status: true }
  });

  if (!bid) {
    return NextResponse.json({ message: "Bid not found" }, { status: 404 });
  }

  if (bid.status !== "PENDING") {
    return NextResponse.json({ message: "Bid is no longer pending" }, { status: 400 });
  }

  await prisma.$transaction(async tx => {
    await tx.bid.update({
      where: { id: bidId },
      data: { status: "ACCEPTED" }
    });
    await tx.bid.updateMany({
      where: { contractId: params.id, id: { not: bidId } },
      data: { status: "REJECTED" }
    });
    await tx.contract.update({
      where: { id: params.id },
      data: {
        acceptedBidId: bidId,
        status: "ACTIVE"
      }
    });
  });

  return NextResponse.json({ ok: true });
}

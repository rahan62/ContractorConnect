import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMonetizationConfig } from "@/lib/monetization";

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true, companyName: true, name: true, email: true, tokenBalance: true }
  });

  if (!user || user.userType !== "SUBCONTRACTOR") {
    return NextResponse.json({ message: "Only sub-contractors can bid" }, { status: 403 });
  }

  const body = await request.json();
  const { amount, message, documentUrl } = body as { amount: number; message?: string; documentUrl?: string };

  if (!amount || amount <= 0) {
    return NextResponse.json({ message: "Amount must be positive" }, { status: 400 });
  }

  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }

  const monetization = await getMonetizationConfig();
  const cost = monetization.tokensPerBid;

  if ((user.tokenBalance ?? 0) < cost) {
    return NextResponse.json(
      { message: "Insufficient tokens to place a bid. Please contact support to receive more tokens." },
      { status: 400 }
    );
  }

  try {
    const bid = await prisma.$transaction(async tx => {
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { tokenBalance: true }
      });

      if (!freshUser || freshUser.tokenBalance < cost) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      const created = await tx.bid.create({
        data: {
          contractId: params.id,
          bidderId: user.id,
          amount,
          currency: message || null,
          documentUrl: documentUrl || null
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

    return NextResponse.json(
      {
        id: bid.id,
        bidderName: user.companyName ?? user.name ?? user.email,
        amount: null,
        message: null,
        documentUrl: null
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof Error && err.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { message: "Insufficient tokens to place a bid. Please contact support to receive more tokens." },
        { status: 400 }
      );
    }
    throw err;
  }
}


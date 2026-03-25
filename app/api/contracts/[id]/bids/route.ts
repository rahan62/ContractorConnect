import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMonetizationConfig } from "@/lib/monetization";
import { BID_CURRENCIES, type BidCurrency } from "@/lib/bid-display";

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

  if (!user || (user.userType !== "SUBCONTRACTOR" && user.userType !== "TEAM")) {
    return NextResponse.json({ message: "Only sub-contractors and teams can bid" }, { status: 403 });
  }

  const body = await request.json();
  const { amount, message, documentUrl, currency } = body as {
    amount: number;
    message?: string;
    documentUrl?: string;
    currency?: string;
  };

  if (amount == null || Number(amount) <= 0) {
    return NextResponse.json({ message: "Amount must be positive" }, { status: 400 });
  }

  const cur = (currency ?? "TRY").toUpperCase();
  if (!(BID_CURRENCIES as readonly string[]).includes(cur)) {
    return NextResponse.json({ message: "Currency must be TRY, EUR, or USD" }, { status: 400 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: { id: true, status: true }
  });
  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }
  if (contract.status !== "OPEN_FOR_BIDS") {
    return NextResponse.json({ message: "This contract is not open for bids" }, { status: 400 });
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
          amount: String(Number(amount)),
          currency: cur as BidCurrency,
          message: message?.trim() || null,
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


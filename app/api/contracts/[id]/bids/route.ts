import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMonetizationConfig } from "@/lib/monetization";
import { BID_CURRENCIES, normalizeBidForResponse, type BidCurrency } from "@/lib/bid-display";
import { getBidEditEligibility } from "@/lib/bid-edit";

interface Params {
  params: { id: string };
}

function bidJson(
  bid: {
    id: string;
    amount: unknown;
    currency: string | null;
    message: string | null;
    documentUrl: string | null;
    status: string;
    createdAt: Date;
    lastEditedAt: Date | null;
  },
  bidderName: string
) {
  const norm = normalizeBidForResponse(bid);
  const elig = getBidEditEligibility(bid.lastEditedAt);
  return {
    id: bid.id,
    bidderName,
    amount: norm.amount,
    currency: norm.currency,
    message: norm.message,
    documentUrl: bid.documentUrl ?? null,
    status: bid.status,
    createdAt: bid.createdAt.toISOString(),
    lastEditedAt: bid.lastEditedAt?.toISOString() ?? null,
    canEdit: elig.canEdit,
    nextEditAvailableAt: elig.nextEditAvailableAt
  };
}

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true, companyName: true, name: true, email: true, tokenBalance: true, isVerified: true }
  });

  if (!user || (user.userType !== "SUBCONTRACTOR" && user.userType !== "TEAM")) {
    return NextResponse.json(
      { message: "Only sub-contractors and field crews can bid" },
      { status: 403 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      {
        message:
          "Your company account must be approved by an operator before you can bid on contracts. You will be notified when your registration is verified."
      },
      { status: 403 }
    );
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
    select: {
      id: true,
      status: true,
      requiredSubcontractorMainCategories: {
        select: { mainCategoryId: true }
      }
    }
  });
  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }
  if (contract.status !== "OPEN_FOR_BIDS") {
    return NextResponse.json({ message: "This contract is not open for bids" }, { status: 400 });
  }

  const existingBid = await prisma.bid.findUnique({
    where: {
      contractId_bidderId: { contractId: params.id, bidderId: user.id }
    },
    select: { id: true }
  });
  if (existingBid) {
    return NextResponse.json(
      {
        message:
          "You already have a bid on this contract. You can update it from the bid form (edits are limited to once every 3 hours)."
      },
      { status: 409 }
    );
  }

  const requiredIds = contract.requiredSubcontractorMainCategories.map(r => r.mainCategoryId);
  if (requiredIds.length > 0) {
    const bidderLinks = await prisma.userSubcontractorMainCategory.findMany({
      where: { userId: user.id },
      select: { mainCategoryId: true }
    });
    const have = new Set(bidderLinks.map(b => b.mainCategoryId));
    const missing = requiredIds.filter(id => !have.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          message:
            "This job requires trade categories you have not been assigned. You must cover every required main trade group to bid."
        },
        { status: 400 }
      );
    }
  }

  const monetization = await getMonetizationConfig();
  const cost = monetization.tokensPerBid;

  if ((user.tokenBalance ?? 0) < cost) {
    return NextResponse.json(
      { message: "Insufficient tokens to place a bid. Please contact support to receive more tokens." },
      { status: 400 }
    );
  }

  const bidderName = user.companyName ?? user.name ?? user.email;

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

    return NextResponse.json(bidJson(bid, bidderName), { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { message: "Insufficient tokens to place a bid. Please contact support to receive more tokens." },
        { status: 400 }
      );
    }
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json(
        {
          message:
            "You already have a bid on this contract. You can update it from the bid form (edits are limited to once every 3 hours)."
        },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true, companyName: true, name: true, email: true, isVerified: true }
  });

  if (!user || (user.userType !== "SUBCONTRACTOR" && user.userType !== "TEAM")) {
    return NextResponse.json(
      { message: "Only sub-contractors and field crews can update bids" },
      { status: 403 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      {
        message:
          "Your company account must be approved by an operator before you can bid on contracts. You will be notified when your registration is verified."
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { amount, message, documentUrl, currency } = body as {
    amount?: number;
    message?: string;
    documentUrl?: string | null;
    currency?: string;
  };

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      requiredSubcontractorMainCategories: {
        select: { mainCategoryId: true }
      }
    }
  });
  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }
  if (contract.status !== "OPEN_FOR_BIDS") {
    return NextResponse.json({ message: "This contract is not open for bids" }, { status: 400 });
  }

  const bid = await prisma.bid.findUnique({
    where: {
      contractId_bidderId: { contractId: params.id, bidderId: user.id }
    },
    select: {
      id: true,
      status: true,
      lastEditedAt: true,
      amount: true,
      currency: true,
      message: true,
      documentUrl: true
    }
  });

  if (!bid) {
    return NextResponse.json({ message: "No bid found for this contract" }, { status: 404 });
  }
  if (bid.status !== "PENDING") {
    return NextResponse.json({ message: "This bid can no longer be edited" }, { status: 400 });
  }

  const elig = getBidEditEligibility(bid.lastEditedAt);
  if (!elig.canEdit) {
    return NextResponse.json(
      {
        message: "You can only edit your bid once every 3 hours.",
        nextEditAvailableAt: elig.nextEditAvailableAt
      },
      { status: 429 }
    );
  }

  const requiredIds = contract.requiredSubcontractorMainCategories.map(r => r.mainCategoryId);
  if (requiredIds.length > 0) {
    const bidderLinks = await prisma.userSubcontractorMainCategory.findMany({
      where: { userId: user.id },
      select: { mainCategoryId: true }
    });
    const have = new Set(bidderLinks.map(b => b.mainCategoryId));
    const missing = requiredIds.filter(id => !have.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          message:
            "This job requires trade categories you have not been assigned. You must cover every required main trade group to bid."
        },
        { status: 400 }
      );
    }
  }

  const nextAmount = amount != null ? Number(amount) : Number(bid.amount);
  if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
    return NextResponse.json({ message: "Amount must be positive" }, { status: 400 });
  }

  const cur = (currency ?? bid.currency ?? "TRY").toUpperCase();
  if (!(BID_CURRENCIES as readonly string[]).includes(cur)) {
    return NextResponse.json({ message: "Currency must be TRY, EUR, or USD" }, { status: 400 });
  }

  const nextMessage = message !== undefined ? (message?.trim() || null) : bid.message;
  const nextDoc =
    documentUrl !== undefined ? (documentUrl || null) : bid.documentUrl;

  const bidderName = user.companyName ?? user.name ?? user.email;

  const updated = await prisma.bid.update({
    where: { id: bid.id },
    data: {
      amount: String(nextAmount),
      currency: cur as BidCurrency,
      message: nextMessage,
      documentUrl: nextDoc,
      lastEditedAt: new Date()
    }
  });

  return NextResponse.json(bidJson(updated, bidderName));
}

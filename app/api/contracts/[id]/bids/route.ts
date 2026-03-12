import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    select: { id: true, userType: true, companyName: true, name: true, email: true }
  });

  if (!user || user.userType !== "SUBCONTRACTOR") {
    return NextResponse.json({ message: "Only sub-contractors can bid" }, { status: 403 });
  }

  const body = await request.json();
  const { amount, message } = body as { amount: number; message?: string };

  if (!amount || amount <= 0) {
    return NextResponse.json({ message: "Amount must be positive" }, { status: 400 });
  }

  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }

  const bid = await prisma.bid.create({
    data: {
      contractId: params.id,
      bidderId: user.id,
      amount,
      currency: message || null
    }
  });

  return NextResponse.json(
    {
      id: bid.id,
      bidderName: user.companyName ?? user.name ?? user.email,
      amount: null,
      message: null
    },
    { status: 201 }
  );
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, verifierNote } = body as { action?: "approve" | "reject"; verifierNote?: string };

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.companyReference.findUnique({
    where: { id: params.id },
    select: { id: true, verifierId: true, status: true }
  });

  if (!existing || existing.verifierId !== user.id || existing.status !== "PENDING") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await prisma.companyReference.update({
    where: { id: params.id },
    data: {
      status: action === "approve" ? "VERIFIED" : "REJECTED",
      verifierNote: verifierNote?.trim() || null,
      verifiedAt: action === "approve" ? new Date() : null,
      rejectedAt: action === "reject" ? new Date() : null
    }
  });

  return NextResponse.json(updated);
}

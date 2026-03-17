import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRequiredVerifierType(userType: string | null | undefined) {
  if (userType === "SUBCONTRACTOR") return "CONTRACTOR";
  if (userType === "TEAM") return "SUBCONTRACTOR";
  return null;
}

export const dynamic = "force-dynamic";

export async function GET() {
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

  const references = await prisma.companyReference.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      evidenceUrl: true,
      status: true,
      verifierNote: true,
      startsAt: true,
      completedAt: true,
      createdAt: true,
      verifier: {
        select: {
          id: true,
          companyName: true,
          name: true,
          email: true,
          userType: true
        }
      }
    }
  });

  return NextResponse.json(
    references.map(reference => ({
      ...reference,
      verifierName:
        reference.verifier?.companyName ?? reference.verifier?.name ?? reference.verifier?.email ?? null,
      verifierType: reference.verifier?.userType ?? null
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true }
  });

  if (!user || !user.userType || !["CONTRACTOR", "SUBCONTRACTOR", "TEAM"].includes(user.userType)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    location,
    evidenceUrl,
    startsAt,
    completedAt,
    verifierId
  } = body as {
    title?: string;
    description?: string;
    location?: string;
    evidenceUrl?: string;
    startsAt?: string;
    completedAt?: string;
    verifierId?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  }

  const requiredVerifierType = getRequiredVerifierType(user.userType);
  let resolvedVerifierId: string | null = null;
  let status: "PENDING" | "VERIFIED" = "VERIFIED";

  if (requiredVerifierType) {
    if (!verifierId) {
      return NextResponse.json({ message: "Verifier is required" }, { status: 400 });
    }

    const verifier = await prisma.user.findUnique({
      where: { id: verifierId },
      select: { id: true, userType: true, isVerified: true }
    });

    if (!verifier || verifier.userType !== requiredVerifierType || !verifier.isVerified) {
      return NextResponse.json({ message: "Selected verifier is not eligible" }, { status: 400 });
    }

    resolvedVerifierId = verifier.id;
    status = "PENDING";
  }

  const created = await prisma.companyReference.create({
    data: {
      ownerId: user.id,
      verifierId: resolvedVerifierId,
      title: title.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      evidenceUrl: evidenceUrl?.trim() || null,
      startsAt: startsAt ? new Date(startsAt) : null,
      completedAt: completedAt ? new Date(completedAt) : null,
      status,
      verifiedAt: status === "VERIFIED" ? new Date() : null
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      evidenceUrl: true,
      status: true,
      verifierNote: true,
      startsAt: true,
      completedAt: true,
      createdAt: true
    }
  });

  return NextResponse.json(created, { status: 201 });
}

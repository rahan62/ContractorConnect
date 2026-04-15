import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["CONTRACTOR", "SUBCONTRACTOR", "TEAM"]);

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { email: auth.session.user!.email! },
    select: { id: true }
  });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const items = await prisma.categoryExperienceApprovalRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      mainCategory: {
        select: { id: true, slug: true, nameEn: true, nameTr: true }
      }
    }
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { email: auth.session.user!.email! },
    select: { id: true, userType: true }
  });
  if (!user?.userType || !ALLOWED_TYPES.has(user.userType)) {
    return NextResponse.json(
      { message: "Only contractor, sub-contractor and field crew accounts can submit category experience requests." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { mainCategoryId, documentUrls, applicantNote } = body as {
    mainCategoryId?: string;
    documentUrls?: string[];
    applicantNote?: string | null;
  };

  if (!mainCategoryId || typeof mainCategoryId !== "string") {
    return NextResponse.json({ message: "mainCategoryId is required" }, { status: 400 });
  }

  const urls = Array.isArray(documentUrls) ? documentUrls.filter(u => typeof u === "string" && u.trim()) : [];
  if (urls.length === 0) {
    return NextResponse.json(
      { message: "Upload at least one invoice or supporting document (PDF, image, etc.)." },
      { status: 400 }
    );
  }

  const cat = await prisma.subcontractorMainCategory.findUnique({
    where: { id: mainCategoryId },
    select: { id: true }
  });
  if (!cat) {
    return NextResponse.json({ message: "Invalid trade category" }, { status: 400 });
  }

  const pending = await prisma.categoryExperienceApprovalRequest.findFirst({
    where: {
      userId: user.id,
      mainCategoryId,
      status: "PENDING"
    },
    select: { id: true }
  });
  if (pending) {
    return NextResponse.json(
      { message: "You already have a pending request for this category. Wait for operator review or contact support." },
      { status: 400 }
    );
  }

  const created = await prisma.categoryExperienceApprovalRequest.create({
    data: {
      userId: user.id,
      mainCategoryId,
      documentUrls: urls.join(";"),
      applicantNote: typeof applicantNote === "string" && applicantNote.trim() ? applicantNote.trim() : null
    },
    include: {
      mainCategory: {
        select: { id: true, slug: true, nameEn: true, nameTr: true }
      }
    }
  });

  return NextResponse.json(created, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Public list for field crew registration (primary Crew Specialization section). */
export async function GET() {
  const rows = await prisma.crewSpecializationSection.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameTr: true
    }
  });
  return NextResponse.json(rows);
}

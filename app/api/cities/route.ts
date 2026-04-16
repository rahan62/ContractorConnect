import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const cities = await prisma.city.findMany({
    orderBy: { plateCode: "asc" },
    select: {
      id: true,
      plateCode: true,
      nameTr: true
    }
  });

  return NextResponse.json(cities);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface Params {
  params: { cityId: string };
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const city = await prisma.city.findUnique({
    where: { id: params.cityId },
    select: { id: true }
  });
  if (!city) {
    return NextResponse.json({ message: "City not found" }, { status: 404 });
  }

  const districts = await prisma.district.findMany({
    where: { cityId: params.cityId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      nameTr: true
    }
  });

  return NextResponse.json(districts);
}

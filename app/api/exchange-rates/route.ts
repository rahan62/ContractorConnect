import { NextResponse } from "next/server";
import { getTryPerUnit } from "@/lib/exchange-rates";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const tryPerUnit = await getTryPerUnit();
    return NextResponse.json({
      tryPerUnit,
      source: "frankfurter.app",
      disclaimer: "Approximate rates; not for settlement."
    });
  } catch {
    return NextResponse.json(
      { message: "Exchange rates temporarily unavailable" },
      { status: 503 }
    );
  }
}

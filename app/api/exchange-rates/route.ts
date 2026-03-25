import { NextResponse } from "next/server";
import { getTryPerUnit } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

export async function GET() {
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

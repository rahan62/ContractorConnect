import { NextResponse } from "next/server";

// Simple, separate admin API namespace. Real endpoints will use admin authentication
// and isGranted checks from lib/adminAuth.

export async function GET() {
  return NextResponse.json({ status: "ok" });
}


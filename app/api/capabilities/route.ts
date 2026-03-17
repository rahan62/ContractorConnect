import { NextResponse } from "next/server";
import { getCapabilityTree, syncCapabilityCatalog } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

export async function GET() {
  await syncCapabilityCatalog();
  const tree = await getCapabilityTree();
  return NextResponse.json(tree);
}

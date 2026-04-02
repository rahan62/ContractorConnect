import { NextResponse } from "next/server";
import { getCapabilityTree, syncCapabilityCatalog } from "@/lib/capabilities";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  await syncCapabilityCatalog();
  const tree = await getCapabilityTree();
  return NextResponse.json(tree);
}

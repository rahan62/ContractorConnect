import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { requireSession } from "@/lib/api-auth";
import { getStorageBucketId, getSupabaseServiceClient } from "@/lib/supabase-service";

export const runtime = "nodejs";

const ALLOWED_FOLDERS = new Set([
  "misc",
  "dwg",
  "contract-images",
  "contract-documents",
  "company-branding",
  "company-documents",
  "bid-documents",
  "reference-evidence"
]);

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const supabase = getSupabaseServiceClient();
  const bucket = getStorageBucketId();
  if (!supabase || !bucket) {
    return NextResponse.json(
      { message: "Storage is not configured (Supabase URL, service role, or bucket)." },
      { status: 500 }
    );
  }

  let body: { folder?: string; filename?: string; contentType?: string; fileSize?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const folder = typeof body.folder === "string" ? body.folder.trim() : "";
  const filename = typeof body.filename === "string" ? body.filename : "file";
  const fileSize = typeof body.fileSize === "number" && Number.isFinite(body.fileSize) ? body.fileSize : -1;

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ message: "Invalid folder" }, { status: 400 });
  }
  if (fileSize < 0 || fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { message: `File size must be between 0 and ${MAX_UPLOAD_BYTES} bytes` },
      { status: 400 }
    );
  }

  const safeBase = filename.replace(/[/\\]/g, "_") || "file";
  const ext = safeBase.includes(".") ? safeBase.split(".").pop() : undefined;
  const key = `${folder}/${Date.now()}-${randomBytes(8).toString("hex")}${ext ? `.${ext}` : ""}`;

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key);
    if (error || !data) {
      console.error("[upload/presign] createSignedUploadUrl", error);
      return NextResponse.json({ message: error?.message ?? "Could not prepare upload" }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      bucket,
      path: data.path,
      token: data.token,
      url: pub.publicUrl
    });
  } catch (error) {
    console.error("[upload/presign] error", error);
    return NextResponse.json({ message: "Could not prepare upload" }, { status: 500 });
  }
}

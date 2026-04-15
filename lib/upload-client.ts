import { createClient } from "@supabase/supabase-js";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Upload via Supabase Storage signed upload URL (REST API), not S3-compatible PUT.
 * Large files bypass Vercel; CORS is handled for *.supabase.co Storage.
 */
export async function uploadFileToStorage(
  file: File,
  folder:
    | "misc"
    | "dwg"
    | "contract-images"
    | "company-branding"
    | "company-documents"
    | "bid-documents"
    | "reference-evidence"
): Promise<{ key: string; url: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB)`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("App is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size
    })
  });

  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? "Upload failed");
  }

  const { bucket, path, token, url } = (await presignRes.json()) as {
    bucket: string;
    path: string;
    token: string;
    url: string;
  };

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType: file.type || "application/octet-stream"
  });

  if (error) {
    throw new Error(error.message || "Upload to storage failed");
  }

  return { key: path, url };
}

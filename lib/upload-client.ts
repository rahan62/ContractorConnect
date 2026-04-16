import { createClient } from "@supabase/supabase-js";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type UploadFolder =
  | "misc"
  | "dwg"
  | "contract-images"
  | "contract-documents"
  | "category-experience-evidence"
  | "company-branding"
  | "company-documents"
  | "bid-documents"
  | "reference-evidence";

export type UploadProgressCallback = (percent: number) => void;

/** Signed upload PUT with upload progress (falls back to Supabase client on failure). */
function putSignedUploadWithProgress(
  bucket: string,
  objectPath: string,
  token: string,
  file: File,
  onPartProgress?: (percent0to100: number) => void
): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return Promise.reject(new Error("App is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  }

  const base = supabaseUrl.replace(/\/?$/, "");
  const cleanPath = objectPath.replace(/^\/+/, "");
  const fullObjectPath = `${bucket}/${cleanPath}`;
  const uploadUrl = new URL(`${base}/storage/v1/object/upload/sign/${fullObjectPath}`);
  uploadUrl.searchParams.set("token", token);

  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl.toString());
    xhr.setRequestHeader("Authorization", `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onPartProgress) {
        onPartProgress(Math.round((e.loaded / Math.max(e.total, 1)) * 100));
      } else if (onPartProgress) {
        onPartProgress(50);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let msg = `Upload failed (${xhr.status})`;
      try {
        const j = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        msg = j.message || j.error || msg;
      } catch {
        /* ignore */
      }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}

/**
 * Upload via Supabase Storage signed upload URL.
 * Optional `onProgress` reports approximate 0–100 (presign then byte upload).
 */
export async function uploadFileToStorage(
  file: File,
  folder: UploadFolder,
  options?: { onProgress?: UploadProgressCallback }
): Promise<{ key: string; url: string }> {
  const onProgress = options?.onProgress;

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB)`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("App is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  onProgress?.(2);

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

  onProgress?.(8);

  const { bucket, path, token, url } = (await presignRes.json()) as {
    bucket: string;
    path: string;
    token: string;
    url: string;
  };

  try {
    await putSignedUploadWithProgress(bucket, path, token, file, pct => {
      onProgress?.(8 + Math.round((pct / 100) * 92));
    });
  } catch (xhrErr) {
    console.warn("[upload] XHR upload failed, retrying with Supabase client:", xhrErr);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
      contentType: file.type || "application/octet-stream"
    });
    if (error) {
      throw new Error(error.message || "Upload to storage failed");
    }
  }

  onProgress?.(100);
  return { key: path, url };
}

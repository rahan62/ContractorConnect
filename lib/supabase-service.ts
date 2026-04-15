import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client with the service role key. Never import this module from client components.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/** Storage bucket id (same as Supabase Storage bucket name). */
export function getStorageBucketId(): string | null {
  return process.env.S3_BUCKET?.trim() || process.env.SUPABASE_STORAGE_BUCKET?.trim() || null;
}

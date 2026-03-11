const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  [key: string]: unknown;
}

export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!token) {
    console.warn("[turnstile] Missing token");
    // Temporary fallback: allow when token is missing in non-production
    if (process.env.NODE_ENV !== "production") {
      console.warn("[turnstile] Bypassing missing token in non-production");
      return true;
    }
    return false;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] No TURNSTILE_SECRET_KEY configured, allowing for now");
    return true;
  }

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
  });

  const data = (await res.json()) as TurnstileResponse;
  console.log("[turnstile] Verification response", data);

  if (!data.success && process.env.NODE_ENV !== "production") {
    console.warn("[turnstile] Verification failed in non-production, allowing request to proceed");
    return true;
  }

  return data.success;
}


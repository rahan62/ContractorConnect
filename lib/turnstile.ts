const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  [key: string]: unknown;
}

export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const enabled = process.env.TURNSTILE_ENABLED !== "false";
  if (!enabled) {
    return true;
  }

  if (!token) {
    console.warn("[turnstile] Missing token");
    return false;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY is missing while Turnstile is enabled");
    return false;
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

  return data.success;
}


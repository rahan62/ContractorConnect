import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const EMAIL_FROM = process.env.EMAIL_FROM ?? "no-reply@example.com";

export async function sendEmailVerification(params: { to: string; token: string }) {
  const { to, token } = params;
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  console.log("[email] Sending verification email", { to, verificationUrl });

  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured, skipping actual send");
    return;
  }

  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your email",
    html: `<p>Please verify your email by clicking <a href="${verificationUrl}">this link</a>.</p>`
  });

  console.log("[email] Resend response", result);
}


import { Resend } from "resend";
import { getAppBaseUrl } from "@/lib/app-url";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const EMAIL_FROM = process.env.EMAIL_FROM ?? "no-reply@example.com";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Use &amp; in HTML attributes for URLs with query strings */
function escapeHref(url: string) {
  return url.replace(/&/g, "&amp;");
}

function getBrandName() {
  return (process.env.EMAIL_BRAND_NAME ?? "Yüklenicim").trim() || "Yüklenicim";
}

function getLogoUrl(baseUrl: string) {
  const custom = process.env.EMAIL_LOGO_URL?.trim();
  if (custom) {
    return custom;
  }
  return `${baseUrl.replace(/\/+$/, "")}/favicon.svg`;
}

function buildVerificationEmailHtml(params: { brandName: string; logoUrl: string; verificationUrl: string }) {
  const { brandName, logoUrl, verificationUrl } = params;
  const safeBrand = escapeHtml(brandName);
  const safeHref = escapeHref(verificationUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirm your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 32px 8px 32px;text-align:center;">
              <img src="${escapeHtml(logoUrl)}" alt="${safeBrand}" style="display:inline-block;height:48px;width:auto;max-width:220px;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 8px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#0f172a;line-height:1.3;">Confirm your email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;text-align:center;color:#475569;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px 0;">Thanks for joining <strong style="color:#0f172a;">${safeBrand}</strong>. Click the button below to verify your email address and activate your account.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="border-radius:10px;background-color:#1d4ed8;">
                    <a href="${safeHref}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Confirm email address</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 12px 0;">If the button does not work, paste this link into your browser:</p>
              <p style="margin:0;word-break:break-all;"><a href="${safeHref}" style="color:#2563eb;text-decoration:underline;">${safeHref}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function sendEmailVerification(params: { to: string; token: string }) {
  const { to, token } = params;
  const baseUrl = getAppBaseUrl();
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const brandName = getBrandName();
  const logoUrl = getLogoUrl(baseUrl);
  const subject = `Confirm your email — ${brandName}`;

  const text = [
    `Confirm your email for ${brandName}.`,
    "",
    `Open this link in your browser:`,
    verificationUrl,
    "",
    "If you did not create an account, you can ignore this message."
  ].join("\n");

  console.log("[email] Sending verification email", { to, verificationUrl });

  if (!resend) {
    console.log("[email] RESEND_API_KEY not configured, skipping actual send");
    return;
  }

  const html = buildVerificationEmailHtml({ brandName, logoUrl, verificationUrl });

  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text
  });

  console.log("[email] Resend response", result);
}

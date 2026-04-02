import "./globals.css";
import type { ReactNode } from "react";

/** Tab icon is served from `app/icon.svg` (Next.js metadata file convention). */
export const metadata = {
  title: {
    default: "Yüklenicim",
    template: "%s · Yüklenicim"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileEnabled = process.env.NEXT_PUBLIC_TURNSTILE_ENABLED !== "false";

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {turnstileEnabled && turnstileSiteKey && (
          <script
            suppressHydrationWarning
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            async
            defer
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}



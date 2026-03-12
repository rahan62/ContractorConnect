import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  icons: {
    icon: "/favicon.svg"
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



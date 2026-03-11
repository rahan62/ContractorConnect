import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {turnstileSiteKey && (
          <script
            suppressHydrationWarning
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}



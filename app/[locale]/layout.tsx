import type { ReactNode } from "react";
import { getMessages } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppProviders } from "../providers";

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <AppProviders locale={params.locale} messages={messages}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navbar is a client component */}
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer locale={params.locale} />
      </div>
    </AppProviders>
  );
}


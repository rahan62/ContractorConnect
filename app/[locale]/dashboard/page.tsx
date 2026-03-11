"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function DashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  if (!session) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("welcome", { email: session.user?.email ?? "-" })}</p>
    </section>
  );
}


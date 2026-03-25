"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface ProfileData {
  email: string;
  name: string | null;
  phone: string | null;
  userType: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("profile");
  const { data: session, status } = useSession();
  const [user, setUser] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser({
        email: data.email,
        name: data.name,
        phone: data.phone,
        userType: data.userType
      });
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  if (!session || !user) {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="app-page-narrow">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <div className="app-card space-y-3 p-5 sm:p-6">
        <p>
          <span className="font-medium">{t("fields.email")}:</span> {user.email}
        </p>
        <p>
          <span className="font-medium">{t("fields.name")}:</span> {user.name ?? "-"}
        </p>
        <p>
          <span className="font-medium">{t("fields.phone")}:</span> {user.phone ?? "-"}
        </p>
        <p>
          <span className="font-medium">{t("fields.userType")}:</span> {user.userType ?? "-"}
        </p>
      </div>
    </section>
  );
}


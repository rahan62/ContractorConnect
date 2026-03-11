"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  imageUrls?: string | null;
  startsAt?: string | null;
  totalDays?: number | null;
  contractorId?: string | null;
}

export default function ContractsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const locale = useLocale();
  const t = useTranslations("contracts");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/contracts");
      if (!res.ok) return;
      const data = await res.json();
      setContracts(data);
    }
    if (status === "authenticated") {
      void load();
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <Link
            href={`/${locale}/contracts/new`}
            className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            {t("new")}
          </Link>
        </div>
      <div className="space-y-3">
        {contracts.map(c => (
          <Link
            key={c.id}
            href={`/${locale}/contracts/${c.id}`}
            className="block overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="h-44 w-full overflow-hidden border-b bg-slate-100">
              {c.imageUrls?.split(";").filter(Boolean)[0] ? (
                <img
                  src={c.imageUrls.split(";").filter(Boolean)[0]}
                  alt={c.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-50">
                  <img src="/taseron_logo.png" alt="Taseron" className="h-16 w-16 rounded-md opacity-70" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-medium">{c.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {c.description ?? ""}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>{c.startsAt ? `Start: ${new Date(c.startsAt).toLocaleDateString()}` : "Start date not set"}</span>
                <span>{c.totalDays ? `${c.totalDays} days` : "Duration not set"}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Contract ID: {c.id}</p>
            </div>
          </Link>
        ))}
        {contracts.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}


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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <Link
            href={`/${locale}/contracts/new`}
            className="inline-flex w-full items-center justify-center rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground sm:w-auto"
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
              <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                <span>{c.startsAt ? `${t("startLabel")}: ${new Date(c.startsAt).toLocaleDateString()}` : t("noStartDate")}</span>
                <span>{c.totalDays ? `${c.totalDays} ${t("days")}` : t("noDuration")}</span>
              </div>
              <p className="mt-3 break-all text-xs text-muted-foreground">{t("contractId")}: {c.id}</p>
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


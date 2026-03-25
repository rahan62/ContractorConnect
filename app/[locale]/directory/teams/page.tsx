"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface DirectoryTeam {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string | null;
}

export default function TeamsDirectoryPage() {
  const [items, setItems] = useState<DirectoryTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("directory");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/directory/teams");
        if (!res.ok) return;
        const data = await res.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <section className="app-page">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("teamsTitle")}</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loadingTeams")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTeams")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/${locale}/company/${item.leaderId}`}
              className="app-card-sm p-4 text-sm transition-colors hover:bg-muted/30"
            >
              <h2 className="font-semibold">{item.name}</h2>
              {item.leaderName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("teamLeaderLabel")}: {item.leaderName}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}


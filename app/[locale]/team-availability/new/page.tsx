"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface CapabilityNode {
  id: string;
  name: string;
}

export default function NewTeamAvailabilityPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("teamAvailability");
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [professionId, setProfessionId] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [professions, setProfessions] = useState<CapabilityNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    async function loadProfessions() {
      const res = await fetch("/api/capabilities");
      if (!res.ok) return;
      const data = await res.json();
      // Flatten children into a simple list we can treat as professions
      const flat: CapabilityNode[] = [];
      (data as any[]).forEach(group => {
        (group.children as any[]).forEach((item: any) => {
          flat.push({ id: item.id, name: item.name });
        });
      });
      setProfessions(flat);
    }

    void loadProfessions();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/team-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          professionId,
          availableFrom,
          availableTo,
          totalDays: totalDays ? parseInt(totalDays, 10) : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? t("errors.create"));
      }

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message ?? t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </section>
    );
  }

  // Only show to team accounts
  if ((session.user as any).userType !== "TEAM") {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-muted-foreground">{t("notTeamAccount")}</p>
      </section>
    );
  }

  return (
    <section className="app-page-narrow">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <form onSubmit={handleSubmit} className="app-card space-y-4 p-4 sm:p-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.title")}</label>
          <input
            className="mt-1 app-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.description")}</label>
          <textarea
            className="mt-1 min-h-[5rem] app-input"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.profession")}</label>
          <select
            className="mt-1 app-input"
            value={professionId}
            onChange={e => setProfessionId(e.target.value)}
            required
          >
            <option value="">{t("fields.professionPlaceholder")}</option>
            {professions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.availableFrom")}</label>
            <input
              type="date"
              className="mt-1 app-input"
              value={availableFrom}
              onChange={e => setAvailableFrom(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.availableTo")}</label>
            <input
              type="date"
              className="mt-1 app-input"
              value={availableTo}
              onChange={e => setAvailableTo(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.totalDays")}</label>
          <input
            type="number"
            min="1"
            className="mt-1 app-input"
            value={totalDays}
            onChange={e => setTotalDays(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t("creating") : t("submit")}
        </button>
      </form>
    </section>
  );
}


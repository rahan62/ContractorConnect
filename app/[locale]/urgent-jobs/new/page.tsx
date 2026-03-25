"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

interface CapabilityNode {
  id: string;
  name: string;
  children: CapabilityNode[];
}

export default function NewUrgentJobPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("urgentJobs");
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [capabilities, setCapabilities] = useState<CapabilityNode[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    async function loadCapabilities() {
      const res = await fetch("/api/capabilities");
      if (!res.ok) return;
      const data = await res.json();
      setCapabilities(data);
    }

    void loadCapabilities();
  }, []);

  function toggleCapability(id: string) {
    setSelectedCapabilities(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const eligibilityRes = await fetch("/api/contracts/eligibility");
      if (!eligibilityRes.ok) {
        const data = await eligibilityRes.json().catch(() => ({}));
        throw new Error(data.message ?? t("errors.eligibility"));
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startsAt: startsAt || undefined,
          totalDays: totalDays ? parseInt(totalDays, 10) : undefined,
          capabilityIds: selectedCapabilities,
          isUrgent: true
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? t("errors.create"));
      }

      const created = await res.json();
      router.push(`/${locale}/contracts/${created.id}`);
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

  // Only contractors can create urgent jobs
  if ((session.user as any).userType !== "CONTRACTOR") {
    return (
      <section className="app-page-narrow">
        <p className="text-sm text-muted-foreground">{t("notContractorAccount")}</p>
      </section>
    );
  }

  return (
    <section className="app-page-narrow">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("newDescription")}</p>
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
            className="mt-1 min-h-[8rem] app-input"
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.startDate")}</label>
            <input
              type="date"
              className="mt-1 app-input"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("fields.totalDays")}</label>
            <input
              type="number"
              min="1"
              className="mt-1 app-input"
              value={totalDays}
              onChange={e => setTotalDays(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("fields.capabilities")}</label>
          <div className="app-inset mt-2 space-y-3">
            {capabilities.map(group => (
              <div key={group.id} className="space-y-2">
                <p className="text-sm font-medium">{group.name}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.children.map(item => (
                    <label key={item.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCapabilities.includes(item.id)}
                        onChange={() => toggleCapability(item.id)}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
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


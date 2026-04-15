"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { taxonomyLabel } from "@/lib/taxonomy-label";

type MainCategoryOption = { id: string; slug: string; nameEn: string; nameTr: string };

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.register");
  const [mainCategories, setMainCategories] = useState<MainCategoryOption[]>([]);
  const [crewSections, setCrewSections] = useState<MainCategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    userType: "CONTRACTOR",
    companyTaxOffice: "",
    companyTaxNumber: "",
    authorizedPersonName: "",
    authorizedPersonPhone: "",
    subcontractorPrimaryCategoryId: "",
    crewPrimarySectionId: ""
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileMountKey, setTurnstileMountKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileEnabled = process.env.NEXT_PUBLIC_TURNSTILE_ENABLED !== "false" && Boolean(siteKey);

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
    setError(null);
  }, []);

  const handleTurnstileExpired = useCallback(() => {
    setTurnstileToken(null);
    setError(t("errors.turnstileRequired"));
  }, [t]);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    setError(t("errors.turnstileFailed"));
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function loadCats() {
      setCategoriesLoading(true);
      try {
        const [subRes, crewRes] = await Promise.all([
          fetch("/api/subcontractor-main-categories"),
          fetch("/api/crew-specialization-sections")
        ]);
        if (subRes.ok && !cancelled) {
          setMainCategories((await subRes.json()) as MainCategoryOption[]);
        }
        if (crewRes.ok && !cancelled) {
          setCrewSections((await crewRes.json()) as MainCategoryOption[]);
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    void loadCats();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (turnstileEnabled && !turnstileToken) {
      setError(t("errors.turnstileRequired"));
      return;
    }

    if (form.userType === "SUBCONTRACTOR" && !form.subcontractorPrimaryCategoryId) {
      setError(t("errors.subPrimaryCategoryRequired"));
      return;
    }

    if (form.userType === "TEAM" && !form.crewPrimarySectionId) {
      setError(t("errors.crewPrimarySectionRequired"));
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subcontractorPrimaryCategoryId:
          form.userType === "SUBCONTRACTOR" ? form.subcontractorPrimaryCategoryId : undefined,
        crewPrimarySectionId: form.userType === "TEAM" ? form.crewPrimarySectionId : undefined,
        turnstileToken
      })
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data.message as string) ?? t("errors.failed");
      setError(msg);
      if (typeof msg === "string" && msg.toLowerCase().includes("turnstile")) {
        setTurnstileToken(null);
        setTurnstileMountKey(k => k + 1);
      }
      return;
    }

    setSuccess(t("success"));
    setTimeout(() => router.push(`/${locale}/auth/signin`), 2500);
  }

  const isCompany =
    form.userType === "CONTRACTOR" ||
    form.userType === "SUBCONTRACTOR" ||
    form.userType === "TEAM";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4">
      <form onSubmit={handleSubmit} className="app-card w-full space-y-4 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("name")}</label>
            <input
              className="mt-1 app-input"
              value={form.companyName}
              onChange={e => updateField("companyName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("email")}</label>
            <input
              type="email"
              className="mt-1 app-input"
              value={form.email}
              onChange={e => updateField("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("password")}</label>
            <input
              type="password"
              className="mt-1 app-input"
              value={form.password}
              onChange={e => updateField("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("userType")}</label>
            <select
              className="mt-1 app-input"
              value={form.userType}
              onChange={e => {
                const v = e.target.value;
                updateField("userType", v);
                if (v !== "SUBCONTRACTOR") updateField("subcontractorPrimaryCategoryId", "");
                if (v !== "TEAM") updateField("crewPrimarySectionId", "");
              }}
            >
              <option value="CONTRACTOR">{t("contractor")}</option>
              <option value="SUBCONTRACTOR">{t("subcontractor")}</option>
              <option value="TEAM">{t("fieldCrew")}</option>
            </select>
          </div>
        </div>

        {form.userType === "TEAM" && (
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("crewPrimarySection")}</label>
            <select
              className="mt-1 app-input"
              required
              value={form.crewPrimarySectionId}
              onChange={e => updateField("crewPrimarySectionId", e.target.value)}
              disabled={categoriesLoading || crewSections.length === 0}
            >
              <option value="">
                {categoriesLoading ? t("loadingCrewSections") : "—"}
              </option>
              {crewSections.map(c => (
                <option key={c.id} value={c.id}>
                  {taxonomyLabel(locale, c)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t("crewPrimarySectionHint")}</p>
          </div>
        )}

        {form.userType === "SUBCONTRACTOR" && (
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("subPrimaryCategory")}</label>
            <select
              className="mt-1 app-input"
              required
              value={form.subcontractorPrimaryCategoryId}
              onChange={e => updateField("subcontractorPrimaryCategoryId", e.target.value)}
              disabled={categoriesLoading || mainCategories.length === 0}
            >
              <option value="">
                {categoriesLoading ? t("loadingCategories") : "—"}
              </option>
              {mainCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {taxonomyLabel(locale, c)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t("subPrimaryCategoryHint")}</p>
          </div>
        )}

        {isCompany && (
          <div className="app-inset mt-4 space-y-3">
            <h2 className="text-sm font-semibold">{t("companyInfo")}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium">{t("taxOffice")}</label>
                <input
                  className="mt-1 app-input"
                  value={form.companyTaxOffice}
                  onChange={e => updateField("companyTaxOffice", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">{t("taxNumber")}</label>
                <input
                  className="mt-1 app-input"
                  value={form.companyTaxNumber}
                  onChange={e => updateField("companyTaxNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">{t("authorizedName")}</label>
                <input
                  className="mt-1 app-input"
                  value={form.authorizedPersonName}
                  onChange={e => updateField("authorizedPersonName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">{t("authorizedPhone")}</label>
                <input
                  className="mt-1 app-input"
                  value={form.authorizedPersonPhone}
                  onChange={e => updateField("authorizedPersonPhone", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}

        {turnstileEnabled && siteKey && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">{t("turnstileTimingHint")}</p>
            <TurnstileWidget
              key={turnstileMountKey}
              siteKey={siteKey}
              onSuccess={handleTurnstileSuccess}
              onExpired={handleTurnstileExpired}
              onError={handleTurnstileError}
              className="min-h-[65px]"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? `${t("submit")}...` : t("submit")}
        </button>
      </form>
    </div>
  );
}


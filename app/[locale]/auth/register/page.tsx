"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.register");
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    userType: "CONTRACTOR",
    companyTaxOffice: "",
    companyTaxNumber: "",
    authorizedPersonName: "",
    authorizedPersonPhone: ""
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
  }, []);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken })
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Registration failed");
      return;
    }

    setSuccess("Registration successful. Please check your email to verify your account.");
    setTimeout(() => router.push(`/${locale}/auth/signin`), 2500);
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isCompany = form.userType === "CONTRACTOR" || form.userType === "SUBCONTRACTOR";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4">
      <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("name")}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.companyName}
              onChange={e => updateField("companyName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.email}
              onChange={e => updateField("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.password}
              onChange={e => updateField("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("userType")}</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.userType}
              onChange={e => updateField("userType", e.target.value)}
            >
              <option value="CONTRACTOR">{t("contractor")}</option>
              <option value="SUBCONTRACTOR">{t("subcontractor")}</option>
              <option value="TEAM">{t("team")}</option>
            </select>
          </div>
        </div>

        {isCompany && (
          <div className="mt-4 space-y-3 rounded-md border p-3">
            <h2 className="text-sm font-semibold">Company information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Company tax office</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.companyTaxOffice}
                  onChange={e => updateField("companyTaxOffice", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Company tax number</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.companyTaxNumber}
                  onChange={e => updateField("companyTaxNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Authorized person name</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.authorizedPersonName}
                  onChange={e => updateField("authorizedPersonName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Authorized person phone</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.authorizedPersonPhone}
                  onChange={e => updateField("authorizedPersonPhone", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {mounted && siteKey && (
          <div
            className="cf-turnstile mt-2"
            data-sitekey={siteKey}
            data-callback="onTurnstileSuccess"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? `${t("submit")}...` : t("submit")}
        </button>
      </form>
    </div>
  );
}


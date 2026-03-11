"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function SignInPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      turnstileToken
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push(`/${locale}/dashboard`);
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("email")}</label>
          <input
            type="email"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("password")}</label>
          <input
            type="password"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {mounted && siteKey && (
          <div
            className="cf-turnstile mt-2"
            data-sitekey={siteKey}
            data-callback="onTurnstileSuccess"
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
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


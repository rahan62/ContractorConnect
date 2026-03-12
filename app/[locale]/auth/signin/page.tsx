"use client";

import { FormEvent, useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { TurnstileWidget } from "@/components/turnstile-widget";

export default function SignInPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (turnstileEnabled && !turnstileToken) {
      setError(t("errors.turnstileRequired"));
      return;
    }

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
        {turnstileEnabled && siteKey && (
          <TurnstileWidget
            siteKey={siteKey}
            onSuccess={handleTurnstileSuccess}
            onExpired={handleTurnstileExpired}
            onError={handleTurnstileError}
            className="mt-2 min-h-[65px]"
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


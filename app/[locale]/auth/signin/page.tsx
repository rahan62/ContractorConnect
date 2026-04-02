"use client";

import { FormEvent, Suspense, useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { TurnstileWidget } from "@/components/turnstile-widget";

function safePostLoginPath(locale: string, raw: string | null): string {
  if (!raw || !raw.startsWith("/")) {
    return `/${locale}/dashboard`;
  }
  if (!/^\/(en|tr)(\/|$)/.test(raw)) {
    return `/${locale}/dashboard`;
  }
  return raw;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("auth.signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileEnabled = process.env.NEXT_PUBLIC_TURNSTILE_ENABLED !== "false" && Boolean(siteKey);

  const callbackUrl = searchParams.get("callbackUrl");
  const showRedirectNotice = Boolean(callbackUrl);

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

    router.push(safePostLoginPath(locale, callbackUrl));
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <form onSubmit={handleSubmit} className="app-card w-full space-y-4 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        {showRedirectNotice && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            {t("redirectNotice")}
          </p>
        )}
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("email")}</label>
          <input
            type="email"
            className="mt-1 app-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t("password")}</label>
          <input
            type="password"
            className="mt-1 app-input"
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
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
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

function SignInFallback() {
  const t = useTranslations("auth.signin");
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}

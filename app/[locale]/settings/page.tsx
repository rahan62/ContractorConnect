"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");

  return (
    <section className="app-page-narrow">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <div className="app-card space-y-4 p-5 sm:p-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">{t("themeTitle")}</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={`rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors ${
                theme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
              onClick={() => setTheme("light")}
            >
              {t("light")}
            </button>
            <button
              type="button"
              className={`rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
              onClick={() => setTheme("dark")}
            >
              {t("dark")}
            </button>
            <button
              type="button"
              className={`rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors ${
                theme === "system"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
              onClick={() => setTheme("system")}
            >
              {t("system")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


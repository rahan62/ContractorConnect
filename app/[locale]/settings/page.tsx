"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">{t("themeTitle")}</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className={`rounded border px-3 py-2 text-sm ${
                theme === "light" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              {t("light")}
            </button>
            <button
              className={`rounded border px-3 py-2 text-sm ${
                theme === "dark" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              {t("dark")}
            </button>
            <button
              className={`rounded border px-3 py-2 text-sm ${
                theme === "system" ? "bg-primary text-primary-foreground" : ""
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


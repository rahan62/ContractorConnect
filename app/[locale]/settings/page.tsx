"use client";

import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Theme</h2>
          <div className="flex gap-2">
            <button
              className={`rounded border px-3 py-1 text-sm ${
                theme === "light" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              className={`rounded border px-3 py-1 text-sm ${
                theme === "dark" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              className={`rounded border px-3 py-1 text-sm ${
                theme === "system" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setTheme("system")}
            >
              System
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


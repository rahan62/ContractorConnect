import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  // Fallback to English if unknown locale
  const safeLocale = locale === "tr" ? "tr" : "en";
  const messages = (await import(`../messages/${safeLocale}.json`)).default;

  return {
    locale: safeLocale,
    messages
  };
});


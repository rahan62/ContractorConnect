import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const basePath = `/${locale}`;

  return (
    <footer className="border-t border-border/60 bg-card/80 backdrop-blur-sm dark:bg-card/90">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-semibold">Yüklenicim</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("sections.platform")}</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <Link href={basePath} className="block hover:text-foreground">
              {t("links.home")}
            </Link>
            <Link href={`${basePath}/contracts`} className="block hover:text-foreground">
              {t("links.contracts")}
            </Link>
            <Link href={`${basePath}/directory/contractors`} className="block hover:text-foreground">
              {t("links.contractors")}
            </Link>
            <Link href={`${basePath}/directory/subcontractors`} className="block hover:text-foreground">
              {t("links.subcontractors")}
            </Link>
            <Link href={`${basePath}/directory/field-crews`} className="block hover:text-foreground">
              {t("links.fieldCrews")}
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("sections.account")}</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <Link href={`${basePath}/auth/signin`} className="block hover:text-foreground">
              {t("links.signin")}
            </Link>
            <Link href={`${basePath}/auth/register`} className="block hover:text-foreground">
              {t("links.register")}
            </Link>
            <Link href={`${basePath}/company`} className="block hover:text-foreground">
              {t("links.company")}
            </Link>
            <Link href={`${basePath}/settings`} className="block hover:text-foreground">
              {t("links.settings")}
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("sections.contact")}</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <a href="mailto:info@yuklenicim.com" className="block hover:text-foreground">
              info@yuklenicim.com
            </a>
            <p>{t("contactText")}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
        {t("copyright")}
      </div>
    </footer>
  );
}

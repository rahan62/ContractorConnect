import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const t = await getTranslations("homePage");
  const session = await getServerSession(authOptions);
  const basePath = `/${params.locale}`;

  if (!session?.user?.email) {
    return (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#1d4ed8_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center px-4 py-20">
          <div className="max-w-3xl">
            <span lang={params.locale} className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
              {t("hero.badge")}
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-tight text-white md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              {t("hero.description")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={`${basePath}/auth/register`}
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {t("hero.primaryCta")}
              </Link>
              <Link
                href={`${basePath}/auth/signin`}
                className="rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t("hero.secondaryCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrls: true,
      startsAt: true,
      totalDays: true,
      status: true
    }
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("signedIn.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("signedIn.description")}</p>
        </div>
        <Link
          href={`${basePath}/contracts`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("signedIn.viewAll")}
        </Link>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
          {t("signedIn.empty")}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contracts.map(contract => {
            const hero = contract.imageUrls?.split(";").filter(Boolean)[0] ?? null;
            return (
              <Link
                key={contract.id}
                href={`${basePath}/contracts/${contract.id}`}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-48 w-full overflow-hidden border-b bg-slate-100">
                  {hero ? (
                    <img src={hero} alt={contract.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-50">
                      <img src="/taseron_logo.png" alt="Taseron" className="h-16 w-16 rounded-md opacity-70" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="line-clamp-2 text-lg font-semibold">{contract.title}</h2>
                    <span className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                      {t(`statuses.${contract.status}` as any)}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {contract.description || t("signedIn.noDescription")}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2 py-1">
                      {contract.startsAt
                        ? `${t("signedIn.startLabel")}: ${new Date(contract.startsAt).toLocaleDateString()}`
                        : t("signedIn.noStartDate")}
                    </span>
                    <span className="rounded-full border px-2 py-1">
                      {contract.totalDays
                        ? `${contract.totalDays} ${t("signedIn.days")}`
                        : t("signedIn.noDuration")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

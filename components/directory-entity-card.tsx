import Link from "next/link";
import type { ReactNode } from "react";
import { taxonomyLabel, type LocalizedTaxonomy } from "@/lib/taxonomy-label";

type Props = {
  href: string;
  locale: string;
  title: string;
  subtitle?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  isVerified?: boolean;
  verifiedLabel: string;
  locationLabel: string;
  tags?: LocalizedTaxonomy[];
  tagsHeading?: string;
  metaLines?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DirectoryEntityCard({
  href,
  locale,
  title,
  subtitle,
  logoUrl,
  location,
  isVerified,
  verifiedLabel,
  locationLabel,
  tags,
  tagsHeading,
  metaLines,
  aside,
  className
}: Props) {
  return (
    <div
      className={`app-card-sm flex items-stretch gap-3 p-4 text-sm transition-colors hover:bg-muted/30 ${className ?? ""}`}
    >
      <Link
        href={href}
        className="flex min-w-0 flex-1 gap-3 rounded-sm text-foreground no-underline outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
              {initials(title)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold leading-snug">
            <span className="break-words">{title}</span>
            {isVerified && (
              <span className="ml-2 inline-block align-middle rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {verifiedLabel}
              </span>
            )}
          </h2>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {location && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{locationLabel}:</span> {location}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="mt-2">
              {tagsHeading && (
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {tagsHeading}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span
                    key={tag.slug ?? `${tag.nameEn}-${tag.nameTr}`}
                    className="inline-block max-w-full truncate rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                    title={taxonomyLabel(locale, tag)}
                  >
                    {taxonomyLabel(locale, tag)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {metaLines}
        </div>
      </Link>
      {aside}
    </div>
  );
}

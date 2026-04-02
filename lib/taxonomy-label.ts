export type LocalizedTaxonomy = { slug?: string; nameEn: string; nameTr: string };

export function taxonomyLabel(locale: string, row: LocalizedTaxonomy) {
  return locale === "tr" ? row.nameTr : row.nameEn;
}

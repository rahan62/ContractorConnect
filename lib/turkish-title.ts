/** Title-case for Turkish locale (İstanbul, Şırnak, …). */
export function toTurkishTitle(allCaps: string): string {
  const s = allCaps.trim();
  if (!s) return s;
  return s
    .split(/\s+/)
    .map(word => {
      const lower = word.toLocaleLowerCase("tr-TR");
      if (!lower.length) return word;
      return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
    })
    .join(" ");
}

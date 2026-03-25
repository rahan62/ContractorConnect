import type { BidCurrency } from "./bid-display";

type TryPerUnit = Record<BidCurrency, number>;

let memoryCache: { at: number; tryPerUnit: TryPerUnit } | null = null;
const TTL_MS = 60 * 60 * 1000;

/**
 * Frankfurter (ECB-based) — free, no API key. Values: approximate TRY per 1 unit of foreign currency.
 */
async function fetchTryPerUnitUncached(): Promise<TryPerUnit> {
  const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=TRY,EUR", {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error("FX fetch failed");
  }

  const json = (await res.json()) as { rates?: { TRY?: number; EUR?: number } };
  if (!json.rates?.TRY || !json.rates?.EUR) {
    throw new Error("FX invalid payload");
  }

  const { TRY: tryPerUsd, EUR: eurPerUsd } = json.rates;
  const tryPerEur = tryPerUsd / eurPerUsd;

  return {
    TRY: 1,
    USD: tryPerUsd,
    EUR: tryPerEur
  };
}

export async function getTryPerUnit(): Promise<TryPerUnit> {
  const now = Date.now();
  if (memoryCache && now - memoryCache.at < TTL_MS) {
    return memoryCache.tryPerUnit;
  }
  const tryPerUnit = await fetchTryPerUnitUncached();
  memoryCache = { at: now, tryPerUnit };
  return tryPerUnit;
}

export function amountInTry(amount: number, currency: BidCurrency, tryPerUnit: TryPerUnit): number {
  const mult = tryPerUnit[currency] ?? 1;
  return amount * mult;
}

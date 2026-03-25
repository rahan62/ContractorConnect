export const BID_CURRENCIES = ["TRY", "EUR", "USD"] as const;
export type BidCurrency = (typeof BID_CURRENCIES)[number];

export function isBidCurrency(v: string | null | undefined): v is BidCurrency {
  return v != null && (BID_CURRENCIES as readonly string[]).includes(v);
}

/** Legacy rows stored the note text in `currency`; normalize for API responses. */
export function normalizeBidForResponse(bid: {
  amount: unknown;
  currency: string | null;
  message: string | null;
}) {
  let currency = bid.currency ?? "TRY";
  let message = bid.message ?? null;

  if (!isBidCurrency(currency)) {
    message = message ?? (currency || null);
    currency = "TRY";
  }

  const amountNum =
    typeof bid.amount === "number" ? bid.amount : Number(bid.amount);

  return {
    amount: Number.isFinite(amountNum) ? amountNum : 0,
    currency: currency as BidCurrency,
    message
  };
}

export function formatBidMoney(amount: number, currency: BidCurrency, locale: string) {
  const map: Record<BidCurrency, string> = {
    TRY: "TRY",
    EUR: "EUR",
    USD: "USD"
  };
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: map[currency],
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`;
  }
}

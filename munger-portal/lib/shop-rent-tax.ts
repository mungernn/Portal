const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

export interface ShopRentRecord {
  shopNo: string;
  location: string;
  marketName: string | null;
  holderName: string;
  baseMonthlyRent: number;
  rentPaidTillMonth: string | null;
  totalPending: number;
  totalBase: number;
  totalPenalty: number;
  pendingMonthsCount: number;
  note: string;
}

interface ApiShopLookupResponse {
  found: boolean;
  message?: string;
  shop?: {
    shop_no: string;
    location: string;
    market_name: string | null;
  };
  agreement?: {
    holder_name: string;
    base_monthly_rent: string;
    rent_paid_till_month: string | null;
  };
  pendingRent?: {
    pendingMonths: unknown[];
    totalBase: string;
    totalPenalty: string;
    totalPending: string;
    note: string;
  };
}

/**
 * Public, two-factor lookup — same privacy reasoning as property tax's
 * searchPropertyByHoldingNumber: requires BOTH the shop number and its
 * registered mobile number to match, and returns the same generic
 * "not found" outcome whichever one is wrong, so this can't be used to
 * pull up one shop's details by guessing a shop number alone.
 */
export async function lookupShopRent(shopNoQuery: string, mobileNoQuery: string): Promise<ShopRentRecord[]> {
  const shopNo = shopNoQuery.trim();
  const mobileNo = mobileNoQuery.trim();
  if (!shopNo || !mobileNo) return [];

  const res = await fetch(`${API_BASE_URL}/shops/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopNo, mobileNo }),
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Shop lookup failed (${res.status})`);

  const data: ApiShopLookupResponse = await res.json();
  if (!data.found || !data.shop || !data.agreement) return [];

  const pending = data.pendingRent;

  return [
    {
      shopNo: data.shop.shop_no,
      location: data.shop.location,
      marketName: data.shop.market_name,
      holderName: data.agreement.holder_name,
      baseMonthlyRent: parseFloat(data.agreement.base_monthly_rent) || 0,
      rentPaidTillMonth: data.agreement.rent_paid_till_month,
      totalPending: pending ? parseFloat(pending.totalPending) || 0 : 0,
      totalBase: pending ? parseFloat(pending.totalBase) || 0 : 0,
      totalPenalty: pending ? parseFloat(pending.totalPenalty) || 0 : 0,
      pendingMonthsCount: pending ? pending.pendingMonths.length : 0,
      note: pending?.note ?? "",
    },
  ];
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
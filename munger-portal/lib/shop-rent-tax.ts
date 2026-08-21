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
 * registered mobile number to match. On a mismatch, reveals only the
 * last two digits of the registered number (not the full number) so a
 * citizen can recognize a typo, rather than being fully generic.
 */
export interface ShopRentSearchOutcome {
  records: ShopRentRecord[];
  notFoundReason?: "not_found" | "mobile_mismatch";
  registeredMobileLastTwoDigits?: string | null;
}

export async function lookupShopRent(shopNoQuery: string, mobileNoQuery: string): Promise<ShopRentSearchOutcome> {
  const shopNo = shopNoQuery.trim();
  const mobileNo = mobileNoQuery.trim();
  if (!shopNo || !mobileNo) return { records: [] };

  const res = await fetch(`${API_BASE_URL}/shops/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopNo, mobileNo }),
  });

  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    const mismatch = Boolean(body?.details?.mobileMismatch);
    return {
      records: [],
      notFoundReason: mismatch ? "mobile_mismatch" : "not_found",
      registeredMobileLastTwoDigits: body?.details?.registeredMobileLastTwoDigits ?? null,
    };
  }
  if (!res.ok) throw new Error(`Shop lookup failed (${res.status})`);

  const data: ApiShopLookupResponse = await res.json();
  if (!data.found || !data.shop || !data.agreement) return { records: [] };

  const pending = data.pendingRent;

  return {
    records: [
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
    ],
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
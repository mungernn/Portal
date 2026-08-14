import { shopRepository, shopAgreementRepository } from "../repositories/shop.repository";
import { summarizePendingRent } from "./rentCalculation.service";

export interface ShopSearchResult {
  found: boolean;
  message?: string;
  shop?: Record<string, unknown>;
  agreement?: Record<string, unknown>;
  pendingRent?: {
    pendingMonths: { month: string; baseRent: string; penalty: string; total: string }[];
    totalBase: string;
    totalPenalty: string;
    totalPending: string;
    note: string;
  };
}

/** Pending rent is recalculated fresh on every search, never trusted from a stored column — same principle as property tax throughout this system. */
export async function searchShopByShopNo(shopNoRaw: string): Promise<ShopSearchResult> {
  const shopNo = shopNoRaw.trim();
  const shop = await shopRepository.findByShopNo(shopNo);
  if (!shop) {
    return { found: false, message: `No shop found for Shop No: ${shopNo}` };
  }

  const agreement = await shopAgreementRepository.findActiveByShopNo(shopNo);
  if (!agreement) {
    return { found: true, shop: shop as unknown as Record<string, unknown> };
  }

  const pending = summarizePendingRent(agreement);

  return {
    found: true,
    shop: shop as unknown as Record<string, unknown>,
    agreement: agreement as unknown as Record<string, unknown>,
    pendingRent: {
      pendingMonths: pending.pendingMonths.map((m) => ({
        month: m.month,
        baseRent: m.baseRent.toFixed(2),
        penalty: m.penalty.toFixed(2),
        total: m.total.toFixed(2),
      })),
      totalBase: pending.totalBase.toFixed(2),
      totalPenalty: pending.totalPenalty.toFixed(2),
      totalPending: pending.totalPending.toFixed(2),
      note: pending.note,
    },
  };
}

/** Public citizen-facing lookup — same two-factor pattern as property tax's searchPropertyForCitizen(). */
export async function searchShopForCitizen(shopNoRaw: string, mobileNoRaw: string): Promise<ShopSearchResult> {
  const genericNotFound: ShopSearchResult = {
    found: false,
    message: "No matching shop found. Please check the Shop Number and Mobile Number.",
  };

  const result = await searchShopByShopNo(shopNoRaw);
  if (!result.found || !result.agreement) return genericNotFound;

  const storedMobile = String(result.agreement.holder_mobile || "").trim();
  const suppliedMobile = mobileNoRaw.trim();
  if (!storedMobile || storedMobile !== suppliedMobile) return genericNotFound;

  return result;
}
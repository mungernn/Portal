import { parse } from "csv-parse/sync";
import { shopRepository, shopAgreementRepository } from "../repositories/shop.repository";

export interface ShopImportResult {
  shopsCreated: number;
  agreementsCreated: number;
  errors: { row: number; message: string }[];
}

/** Reads the first non-empty value across a few header spelling variants for the same column. */
function pick(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => k.trim().toLowerCase() === c.toLowerCase());
    if (key && row[key]?.trim()) return row[key]!.trim();
  }
  return "";
}

function toNumberOrNull(s: string): number | null {
  return s && /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null;
}

/**
 * Bulk import of shops, optionally with their current tenancy in the
 * same row - a shop with no "Holder Name" is created vacant, a shop
 * with one also gets an agreement record via
 * shopAgreementRepository.insertPartial (data_status='partial', the
 * same path the schema was already designed for migrated/incomplete
 * records - see that method's comment).
 *
 * Holder Name and Base Monthly Rent from the sheet are DELIBERATELY
 * NOT applied to holder_name/base_monthly_rent - there was
 * historically no clarity on which of several possibly-conflicting
 * name/rent sources (the sheet's own Holder Name column vs. its
 * separate Agreement/Demand Register reference columns) should be
 * treated as authoritative, and guessing wrong would mean generating
 * demand notices against the wrong tenant or amount. Both raw values
 * still "sit on the server" rather than being lost - recorded in the
 * agreement's notes as a pending-review line - so whoever reviews the
 * shop later has everything needed to make the correction (fill in
 * holder_name/base_monthly_rent directly, or via a rent escalation
 * period if the figure they choose comes with a known escalation
 * rule). Everything else from the sheet (the reference columns,
 * addresses, dates, deposits, etc.) is still applied normally - only
 * these two specific columns are held back.
 *
 * Only ONE of the three period rent columns (Rent Pre-2019 / Rent
 * 2019-20 / Rent 2020-21 Onwards) needs to be filled in per row -
 * resolveRentPeriodsFromValues derives the other two automatically
 * per the confirmed escalation formula (25% at 2019-20, a further 50%
 * from 2020-21), so this import doesn't require all three; whichever
 * the sheet provides is stored, and the rest are computed at read
 * time, not here.
 */
export async function importShopsCsv(csvContent: string, actorDisplayName: string): Promise<ShopImportResult> {
  const records: Record<string, string>[] = parse(csvContent, { columns: true, skip_empty_lines: true, relax_column_count: true });

  const result: ShopImportResult = { shopsCreated: 0, agreementsCreated: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const row = records[i]!;
    const rowNum = i + 2;
    try {
      const shopNo = pick(row, ["Shop No", "ShopNo", "Shop Number"]);
      if (!shopNo) {
        result.errors.push({ row: rowNum, message: "Missing Shop No" });
        continue;
      }

      const existing = await shopRepository.findByShopNo(shopNo);
      if (existing) {
        result.errors.push({ row: rowNum, message: `Shop "${shopNo}" already exists - skipped` });
        continue;
      }

      const location = pick(row, ["Location"]);
      if (!location) {
        result.errors.push({ row: rowNum, message: `Shop "${shopNo}" is missing Location - skipped` });
        continue;
      }

      const holderNameFromSheet = pick(row, ["Holder Name"]);
      const baseMonthlyRentFromSheet = pick(row, ["Base Monthly Rent"]);
      const isOccupied = Boolean(holderNameFromSheet);

      await shopRepository.upsert(
        shopNo,
        {
          marketName: pick(row, ["Market Name"]) || null,
          location,
          ward: pick(row, ["Ward"]) || null,
          areaSqft: toNumberOrNull(pick(row, ["Area Sqft"])),
          totalAreaSqft: toNumberOrNull(pick(row, ["Total Area Sqft"])),
          builtUpAreaSqft: toNumberOrNull(pick(row, ["Built Up Area Sqft"])),
          status: isOccupied ? "occupied" : "vacant",
        },
        actorDisplayName,
        true,
      );
      result.shopsCreated++;

      if (isOccupied) {
        const sheetNotes = pick(row, ["Notes"]) || null;
        const pendingReviewNote = `[Pending review from bulk upload] Sheet's Holder Name: "${holderNameFromSheet}"${
          baseMonthlyRentFromSheet ? `, Base Monthly Rent: "${baseMonthlyRentFromSheet}"` : ""
        } - not yet applied, confirm the correct value before generating any demand for this shop.`;
        const notes = sheetNotes ? `${sheetNotes}\n\n${pendingReviewNote}` : pendingReviewNote;

        await shopAgreementRepository.insertPartial(
          shopNo,
          {
            agreementNumber: pick(row, ["Agreement Number"]) || null,
            agreementHolderName: pick(row, ["Agreement Holder Name"]) || null,
            demandRegisterHolderName: pick(row, ["Demand Register Holder Name"]) || null,
            holderName: null,
            holderRelationType: pick(row, ["Holder Relation Type"]) || null,
            holderRelationName: pick(row, ["Holder Relation Name"]) || null,
            holderMobile: pick(row, ["Holder Mobile"]) || null,
            holderAddress: pick(row, ["Holder Address"]) || null,
            idProofNumber: pick(row, ["ID Proof Number"]) || null,
            businessName: pick(row, ["Business Name"]) || null,
            agreementRent: toNumberOrNull(pick(row, ["Agreement Rent"])),
            demandRegisterRent: toNumberOrNull(pick(row, ["Demand Register Rent"])),
            baseMonthlyRent: null,
            rentPre2019: toNumberOrNull(pick(row, ["Rent Pre-2019", "Rent Pre 2019"])),
            rent201920: toNumberOrNull(pick(row, ["Rent 2019-20", "Rent 2019 20"])),
            rent202021Onwards: toNumberOrNull(pick(row, ["Rent 2020-21 Onwards", "Rent 2020 21 Onwards"])),
            agreementStartDate: pick(row, ["Agreement Start Date"]) || null,
            agreementEndDate: pick(row, ["Agreement End Date"]) || null,
            securityDeposit: toNumberOrNull(pick(row, ["Security Deposit"])) ?? 0,
            miscCost: toNumberOrNull(pick(row, ["Misc Cost"])) ?? 0,
            miscCostReason: pick(row, ["Misc Cost Reason"]) || null,
            miscRebate: toNumberOrNull(pick(row, ["Misc Rebate"])) ?? 0,
            miscRebateReason: pick(row, ["Misc Rebate Reason"]) || null,
            jointHolderName: pick(row, ["Joint Holder Name"]) || null,
            jointHolderRelation: pick(row, ["Joint Holder Relation"]) || null,
            jointHolderIdProofNumber: pick(row, ["Joint Holder ID Proof Number"]) || null,
            notes,
            rentPaidTillMonth: pick(row, ["Rent Paid Till Month"]) || null,
          },
          actorDisplayName,
        );
        result.agreementsCreated++;
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return result;
}

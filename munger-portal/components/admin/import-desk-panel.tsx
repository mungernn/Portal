"use client";

import { useEffect, useState } from "react";
import { DeskPanel } from "@/components/admin/desk-panel";
import { fetchImportDesks, type ImportDeskCounts } from "@/lib/holding-import-api";

/**
 * Desk-wise pending work of uploaded holdings (one upload, or all open uploads), optionally of one ward: the Tax Daroga
 * reviews and proposes resolutions for held-back holdings, the City Manager integrates reviewed holdings, held-back
 * resolutions go City Manager -> DMC -> Commissioner.
 */
export function ImportDeskPanel({
  batchId,
  ward,
  role,
  refreshKey,
}: {
  batchId: number | null;
  ward?: string;
  role: string;
  refreshKey?: unknown;
}) {
  const [d, setD] = useState<ImportDeskCounts | null>(null);
  useEffect(() => {
    fetchImportDesks(batchId, ward || undefined)
      .then(setD)
      .catch(() => setD(null));
  }, [batchId, ward, refreshKey]);
  if (!d) return null;
  return (
    <DeskPanel
      title={`Desk-wise pending${batchId === null ? " - all open uploads" : ""}${ward ? ` - ward ${ward}` : ""}`}
      myRole={role}
      note="Review: Tax Daroga marks holdings reviewed, City Manager integrates them. Held back / not uploaded: Tax Daroga proposes a resolution, then City Manager, DMC and the Commissioner's approval."
      desks={[
        {
          desk: "Tax Daroga",
          role: "tax_daroga",
          items: [
            { label: "Holdings to review", count: d.taxDaroga.toReview },
            { label: "Held back - to propose", count: d.taxDaroga.toPropose },
            { label: "Resolutions sent back", count: d.taxDaroga.sentBack },
          ],
        },
        {
          desk: "City Manager",
          role: "city_manager",
          items: [
            { label: "Reviewed - to integrate", count: d.cityManager.toIntegrate },
            { label: "Resolutions to recommend", count: d.cityManager.cases },
          ],
        },
        { desk: "DMC", role: "deputy_commissioner", items: [{ label: "Resolutions to recommend", count: d.deputyCommissioner.cases }] },
        { desk: "Commissioner", role: "commissioner", items: [{ label: "Resolutions to approve", count: d.commissioner.cases }] },
      ]}
    />
  );
}

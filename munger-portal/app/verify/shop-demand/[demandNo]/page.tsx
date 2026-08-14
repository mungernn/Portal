"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VerificationLayout, VerificationField } from "@/components/verification-layout";
import { verifyShopDemand } from "@/lib/verify-api";

function Content() {
  const params = useParams<{ demandNo: string }>();
  const searchParams = useSearchParams();
  const sig = searchParams.get("sig") ?? "";

  const [data, setData] = useState<Awaited<ReturnType<typeof verifyShopDemand>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sig) {
      setError("This verification link is missing its signature — use the link from the QR code exactly as scanned.");
      setLoading(false);
      return;
    }
    verifyShopDemand(params.demandNo, sig)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Verification failed."))
      .finally(() => setLoading(false));
  }, [params.demandNo, sig]);

  return (
    <VerificationLayout loading={loading} error={error} title="Municipal Shop Rent Demand">
      {data && (
        <>
          <VerificationField label="Demand No" value={data.formattedDemandNo} />
          <VerificationField label="Date" value={data.demandDate} />
          <VerificationField label="Shop No" value={data.shopNo} />
          <VerificationField label="Market" value={data.marketName ?? "—"} />
          <VerificationField label="Location" value={data.location} />
          <VerificationField label="Holder Name" value={data.holderName} />
          <VerificationField label="Total Amount Demanded" value={`₹${Number(data.totalAmountDemanded).toLocaleString("en-IN")}`} />
          <VerificationField label="Status" value={data.settled ? "Settled" : "Not yet settled"} />
        </>
      )}
    </VerificationLayout>
  );
}

export default function VerifyShopDemandPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-400">Loading…</div>}>
      <Content />
    </Suspense>
  );
}
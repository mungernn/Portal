"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VerificationLayout, VerificationField } from "@/components/verification-layout";
import { verifyDemandNotice } from "@/lib/verify-api";

function Content() {
  const params = useParams<{ demandNo: string }>();
  const searchParams = useSearchParams();
  const sig = searchParams.get("sig") ?? "";

  const [data, setData] = useState<Awaited<ReturnType<typeof verifyDemandNotice>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sig) {
      setError("This verification link is missing its signature — use the link from the QR code exactly as scanned.");
      setLoading(false);
      return;
    }
    verifyDemandNotice(params.demandNo, sig)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Verification failed."))
      .finally(() => setLoading(false));
  }, [params.demandNo, sig]);

  return (
    <VerificationLayout loading={loading} error={error} title="Property Tax Demand Notice">
      {data && (
        <>
          <VerificationField label="Demand Notice No" value={data.formattedDemandNo} />
          <VerificationField label="Date" value={data.date} />
          <VerificationField label="Holding No" value={data.holdingNo} />
          <VerificationField label="Owner Name" value={data.ownerName} />
          <VerificationField label="Address" value={data.address} />
          {data.assessmentYear && <VerificationField label="Assessment Year" value={data.assessmentYear} />}
          <VerificationField label="Total Amount Demanded" value={`₹${Number(data.totalAmountDemanded).toLocaleString("en-IN")}`} />
          <VerificationField label="Status" value={data.settled ? `Settled (Receipt ${data.settledReceiptNo})` : "Not yet settled"} />
        </>
      )}
    </VerificationLayout>
  );
}

export default function VerifyDemandNoticePage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-400">Loading…</div>}>
      <Content />
    </Suspense>
  );
}
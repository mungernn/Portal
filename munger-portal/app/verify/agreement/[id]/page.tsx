"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VerificationLayout, VerificationField } from "@/components/verification-layout";
import { verifyAgreement } from "@/lib/verify-api";

function Content() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sig = searchParams.get("sig") ?? "";

  const [data, setData] = useState<Awaited<ReturnType<typeof verifyAgreement>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sig) {
      setError("This verification link is missing its signature — use the link from the QR code exactly as scanned.");
      setLoading(false);
      return;
    }
    verifyAgreement(params.id, sig)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Verification failed."))
      .finally(() => setLoading(false));
  }, [params.id, sig]);

  return (
    <VerificationLayout loading={loading} error={error} title="Municipal Shop Rental Agreement">
      {data && (
        <>
          {data.agreementNumber && <VerificationField label="Agreement No" value={data.agreementNumber} />}
          <VerificationField label="Shop No" value={data.shopNo} />
          <VerificationField label="Market" value={data.marketName ?? "—"} />
          <VerificationField label="Location" value={data.location} />
          <VerificationField label="Holder Name" value={data.holderName} />
          <VerificationField label="Monthly Rent" value={`₹${Number(data.baseMonthlyRent).toLocaleString("en-IN")}`} />
          {data.agreementStartDate && <VerificationField label="Start Date" value={data.agreementStartDate} />}
          {data.agreementEndDate && <VerificationField label="End Date" value={data.agreementEndDate} />}
          <VerificationField label="Status" value={data.status} />
        </>
      )}
    </VerificationLayout>
  );
}

export default function VerifyAgreementPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-400">Loading…</div>}>
      <Content />
    </Suspense>
  );
}
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VerificationLayout, VerificationField } from "@/components/verification-layout";
import { verifyViolationNotice } from "@/lib/verify-api";

function Content() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sig = searchParams.get("sig") ?? "";

  const [data, setData] = useState<Awaited<ReturnType<typeof verifyViolationNotice>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sig) {
      setError("This verification link is missing its signature — use the link from the QR code exactly as scanned.");
      setLoading(false);
      return;
    }
    verifyViolationNotice(params.id, sig)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Verification failed."))
      .finally(() => setLoading(false));
  }, [params.id, sig]);

  return (
    <VerificationLayout loading={loading} error={error} title="Municipal Shop Violation Notice">
      {data && (
        <>
          <VerificationField label="Shop No" value={data.shopNo} />
          <VerificationField label="Market" value={data.marketName ?? "—"} />
          <VerificationField label="Location" value={data.location} />
          <VerificationField label="Category" value={data.violationCategory} />
          <VerificationField label="Issued Date" value={new Date(data.issuedDate).toLocaleDateString("en-IN")} />
          <VerificationField label="Issued By" value={data.issuedBy} />
          <VerificationField label="Status" value={data.status.charAt(0).toUpperCase() + data.status.slice(1)} />
        </>
      )}
    </VerificationLayout>
  );
}

export default function VerifyViolationNoticePage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-400">Loading…</div>}>
      <Content />
    </Suspense>
  );
}
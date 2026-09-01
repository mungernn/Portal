"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2, Upload } from "lucide-react";
import {
  fetchShopAgreementDocumentMeta,
  uploadShopAgreementDocument,
  fetchShopAgreementDocumentBlobUrl,
  type ShopAgreementDocumentMeta,
} from "@/lib/shop-api";

/** Upload/view the signed agreement PDF for a shop - kept safe (stored server-side), one current copy per shop, replacing on re-upload. */
export function ShopAgreementDocumentPanel({ shopNo }: { shopNo: string }) {
  const [meta, setMeta] = useState<ShopAgreementDocumentMeta | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    fetchShopAgreementDocumentMeta(shopNo)
      .then(setMeta)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not check for an agreement document."));
  }, [shopNo]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      e.target.value = "";
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const updated = await uploadShopAgreementDocument(shopNo, file);
      setMeta(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload this file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleView() {
    setError(null);
    setViewing(true);
    try {
      const url = await fetchShopAgreementDocumentBlobUrl(shopNo);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the document.");
    } finally {
      setViewing(false);
    }
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Agreement Document</h3>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {meta === undefined ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking…
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {meta && (
            <button
              onClick={handleView}
              disabled={viewing}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <FileText className="h-3.5 w-3.5" />
              {viewing ? "Opening…" : `View ${meta.file_name}`}
            </button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-nnm-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : meta ? "Replace PDF" : "Upload Signed Agreement (PDF)"}
            <input type="file" accept="application/pdf" onChange={handleFileSelected} disabled={uploading} className="hidden" />
          </label>
          {meta && (
            <span className="text-xs text-slate-400">
              Uploaded by {meta.uploaded_by} on {new Date(meta.uploaded_at).toLocaleDateString("en-IN")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

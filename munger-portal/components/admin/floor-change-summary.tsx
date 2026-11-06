import { AuthPhoto } from "@/components/admin/field-verification-photos";

/** For approvers: how the requested floor change applies, and the premises photo (change requests). */
export function FloorChangeSummary({
  floorChange,
  premisesPhotoPath,
  useChange,
}: {
  floorChange?: { kind?: string; effectiveYear?: string | null; reason?: string } | null;
  premisesPhotoPath?: string | null;
  useChange?: boolean;
}) {
  if (!floorChange?.kind && !premisesPhotoPath && !useChange) return null;
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-slate-800">
      <p className="font-semibold text-amber-900">
        {useChange ? "Change of use / back-dated floor change - Tax Daroga → City Manager → Deputy Commissioner" : "Floor change"}
      </p>
      {floorChange?.kind === "from_year" && (
        <p className="mt-1">
          <b>Changed from {floorChange.effectiveYear}</b> - years before it keep the old floor details; {floorChange.effectiveYear} onward
          use the new ones.
        </p>
      )}
      {floorChange?.kind === "correction" && (
        <p className="mt-1">
          <b>Correction of a mistake</b> - the new details apply to every year; all unpaid years are recalculated.
        </p>
      )}
      {floorChange?.reason && (
        <p className="mt-1">
          <b>Reason:</b> {floorChange.reason}
        </p>
      )}
      {premisesPhotoPath && (
        <div className="mt-2">
          <AuthPhoto path={premisesPhotoPath} label="Photo of the premises" large />
        </div>
      )}
    </div>
  );
}

import { QRCodeSVG } from "qrcode.react";

export function DocumentVerificationQR({ url }: { url: string }) {
  return (
    <div className="w-[64px] shrink-0 text-center">
      <QRCodeSVG value={url} size={60} level="M" />
      <p className="mt-1 text-[8px] font-semibold text-slate-500">Verify me</p>
    </div>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface PortalRoleCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  ctaLabel?: string;
}

export function PortalRoleCard({
  title,
  description,
  href,
  icon: Icon,
  ctaLabel = "Login",
}: PortalRoleCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
        <Icon className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mb-6 text-sm text-slate-500">{description}</p>
      <Link
        href={href}
        className="w-full rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nnm-blue-dark"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
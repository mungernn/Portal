import type { Metadata } from "next";
import { ShieldCheck, Users } from "lucide-react";
import { PortalBrandingHeader } from "@/components/portal-branding-header";
import { PortalRoleCard } from "@/components/portal-role-card";

export const metadata: Metadata = {
  title: "Portal Access — Munger Nagar Nigam",
  description:
    "Sign in to the Munger Nagar Nigam staff portal as an administrator or operator.",
};

export default function PortalLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Portal Access
        </h1>
        <p className="mb-4 max-w-md text-sm text-slate-500">
          Select how you&apos;d like to sign in to the NNM staff portal.
        </p>

        <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 sm:flex-row sm:items-stretch">
          <PortalRoleCard
            title="Administrator Login"
            description="Municipal administrators with full system access."
            href="/portal-login/admin"
            icon={ShieldCheck}
          />
          <PortalRoleCard
            title="Operator Login"
            description="Municipal staff and data entry operators."
            href="/portal-login/operator"
            icon={Users}
          />
        </div>
      </main>
    </div>
  );
}
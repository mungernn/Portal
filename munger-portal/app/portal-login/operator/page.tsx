import type { Metadata } from "next";
import { PortalBrandingHeader } from "@/components/portal-branding-header";
import { OperatorLoginClient } from "@/components/operator-login-client";

export const metadata: Metadata = {
  title: "Operator Login — Munger Nagar Nigam",
  description: "Sign in as a municipal staff or data entry operator.",
};

export default function OperatorLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <OperatorLoginClient />
      </main>
    </div>
  );
}
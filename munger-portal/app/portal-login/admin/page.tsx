import type { Metadata } from "next";
import { PortalBrandingHeader } from "@/components/portal-branding-header";
import { AdminLoginClient } from "@/components/admin-login-client";

export const metadata: Metadata = {
  title: "Administrator Login — Munger Nagar Nigam",
  description: "Sign in as a municipal administrator.",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <AdminLoginClient />
      </main>
    </div>
  );
}
import type { Metadata } from "next";
import { PortalBrandingHeader } from "@/components/portal-branding-header";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — Operator Login — Munger Nagar Nigam",
  description: "Reset your operator account password.",
};

export default function OperatorForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <ForgotPasswordForm
          role="operator"
          heading="Forgot Password"
          description="Enter the email on file for your operator account and we'll send a reset link."
        />
      </main>
    </div>
  );
}
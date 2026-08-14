"use client";

import { Suspense } from "react";
import { PortalBrandingHeader } from "@/components/portal-branding-header";
import { ResetPasswordForm } from "@/components/reset-password-form";

function ResetPasswordContent() {
  return (
    <ResetPasswordForm
      role="operator"
      heading="Reset Password"
      description="Choose a new password for your operator account."
    />
  );
}

export default function OperatorResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
          <ResetPasswordContent />
        </Suspense>
      </main>
    </div>
  );
}
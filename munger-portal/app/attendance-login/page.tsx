import type { Metadata } from "next";
import { PortalBrandingHeader } from "@/components/portal-branding-header";
import { AttendanceLoginClient } from "@/components/attendance/attendance-login-client";

export const metadata: Metadata = {
  title: "Asset Management Login - Munger Nagar Nigam",
  description: "Sign in to manage field staff attendance, fleet, street lights, or submersible pyau.",
};

export default function AttendanceLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <AttendanceLoginClient />
      </main>
    </div>
  );
}

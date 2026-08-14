import type { Metadata } from "next";
import Link from "next/link";
import { CitizenLoginForm } from "@/components/citizen-login-form";

export const metadata: Metadata = {
  title: "Citizen Login — Munger Nagar Nigam",
  description:
    "Log in to the Munger Nagar Nigam citizen services portal with your registered mobile number.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="bg-nnm-blue-dark py-1.5 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
        Government of Bihar
      </div>

      <header className="flex justify-center pb-2 pt-10">
        <Link href="/" className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nnm-blue font-display text-2xl font-bold text-nnm-gold">
            म
          </span>
          <span>
            <span className="block font-display text-lg font-semibold text-slate-900">
              मुंगेर नगर निगम
            </span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
              Munger Nagar Nigam · Citizen Services Portal
            </span>
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <CitizenLoginForm />
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">
        Need help?{" "}
        <Link href="/#contact" className="font-medium text-nnm-blue hover:underline">
          Contact your ward office
        </Link>
      </footer>
    </div>
  );
}

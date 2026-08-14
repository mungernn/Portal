"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { operatorLogout, type OperatorInfo } from "@/lib/auth";

export function OperatorHeader({ operator }: { operator: OperatorInfo }) {
  const router = useRouter();

  function handleLogout() {
    operatorLogout();
    router.push("/portal-login/operator");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link href="/operator/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nnm-blue font-display text-sm font-bold text-nnm-gold">
            ?
          </span>
          <span className="text-sm font-semibold text-slate-900">NNM Operator Portal</span>
        </Link>
        <nav className="hidden sm:block">
          <Link href="/operator/dashboard" className="text-sm font-semibold text-slate-500 hover:text-nnm-blue">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{operator.displayName}</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
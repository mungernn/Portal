"use client";

import Link from "next/link";
import { Receipt, Pencil, Sparkles } from "lucide-react";
import { OperatorHeader } from "@/components/operator-header";
import { useOperatorGuard } from "@/lib/use-operator-guard";

const options = [
  {
    title: "Rent Collection",
    description: "Search a shop by number, generate a demand, and collect payment.",
    icon: Receipt,
    href: "/operator/shops",
  },
  {
    title: "Update Shop / Agreement",
    description: "Search a shop and edit its existing agreement — holder, rent, terms.",
    icon: Pencil,
    href: "/operator/shops",
  },
  {
    title: "Add a New or Existing-on-Paper Shop",
    description: "A brand-new, auto-numbered shop, or one from the paper register not yet in the system - both start here.",
    icon: Sparkles,
    href: "/operator/shops/new-entry",
  },
];

export default function ShopsHubPage() {
  const operator = useOperatorGuard();

  if (!operator) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OperatorHeader operator={operator} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Nagar Nigam Shop / Stall</h1>
        <p className="mb-8 text-sm text-slate-500">Choose what you need to do.</p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {options.map((opt) => (
            <Link
              key={opt.title}
              href={opt.href}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
                <opt.icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="mb-1.5 text-base font-semibold text-slate-900">{opt.title}</h3>
              <p className="text-sm text-slate-500">{opt.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
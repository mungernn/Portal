"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TradeLicenseApplicationForm, TradeLicenseSubmitSuccess } from "@/components/trade-license-application-form";
import type { SubmitResult } from "@/lib/trade-license-api";

export default function TradeLicensePage() {
  const [result, setResult] = useState<SubmitResult | null>(null);

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-nnm-blue to-nnm-blue-dark py-16 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <span className="mb-2.5 block font-mono text-[12.5px] uppercase tracking-[0.14em] text-nnm-gold">
              Counter 04
            </span>
            <h1 className="mb-3 font-display text-3xl font-semibold sm:text-4xl">Trade License</h1>
            <p className="max-w-xl text-[17px] text-white/80">
              Apply for a new trade license, or renew an existing one.
            </p>
          </div>
        </section>

        <section className="bg-paper-dim py-14">
          <div className="mx-auto max-w-3xl px-6">
            {result ? (
              <TradeLicenseSubmitSuccess result={result} />
            ) : (
              <TradeLicenseApplicationForm mode="public" onSubmitted={setResult} />
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
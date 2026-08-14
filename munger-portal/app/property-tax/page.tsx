import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyTaxSearch } from "@/components/property-tax-search";

export const metadata: Metadata = {
  title: "Property Tax Search — Munger Nagar Nigam",
  description:
    "Search your property by holding number to view current dues, arrears, and pay your Munger Nagar Nigam property tax online.",
};

export default function PropertyTaxPage() {
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-nnm-blue to-nnm-blue-dark py-16 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <span className="mb-2.5 block font-mono text-[12.5px] uppercase tracking-[0.14em] text-nnm-gold">
              Counter 01
            </span>
            <h1 className="mb-3 font-display text-3xl font-semibold sm:text-4xl">
              Property Tax Search
            </h1>
            <p className="max-w-xl text-[17px] text-white/80">
              Enter your holding number to look up current dues and arrears,
              and pay your property tax online.
            </p>
          </div>
        </section>

        <section className="bg-paper-dim py-14">
          <div className="mx-auto max-w-3xl px-6">
            <PropertyTaxSearch />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

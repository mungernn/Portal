import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShopRentSearch } from "@/components/shop-rent-search";

export const metadata: Metadata = {
  title: "Municipal Shop Rent — Munger Nagar Nigam",
  description:
    "Search your municipal shop by shop number to view current rent dues and pending amounts for Munger Nagar Nigam.",
};

export default function ShopRentPage() {
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
              Municipal Shop Rent
            </h1>
            <p className="max-w-xl text-[17px] text-white/80">
              Enter your shop number to check current rent dues and pending amounts.
            </p>
          </div>
        </section>

        <section className="bg-paper-dim py-14">
          <div className="mx-auto max-w-3xl px-6">
            <ShopRentSearch />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
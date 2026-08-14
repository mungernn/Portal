import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, FileEdit, Download } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Nagar Nigam Shops — Munger Nagar Nigam",
  description: "Pay municipal shop rent, apply for a new rental shop, or download your shop's details.",
};

const options = [
  {
    title: "Shop Rent Payment",
    description: "Check your shop's current rent dues, penalty, and payment status.",
    icon: Receipt,
    href: "/shop-rent",
    cta: "Check Dues",
  },
  {
    title: "Apply for New Rental Shop",
    description: "Browse currently vacant municipal shops and submit a rental application.",
    icon: FileEdit,
    href: "/nagar-nigam-shops/apply",
    cta: "Apply Now",
  },
  {
    title: "Download My Shop Details",
    description: "Verify your shop number and mobile number to view and download your agreement details.",
    icon: Download,
    href: "/nagar-nigam-shops/my-shop",
    cta: "Get Details",
  },
];

export default function NagarNigamShopsHubPage() {
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-nnm-blue to-nnm-blue-dark py-16 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <span className="mb-2.5 block font-mono text-[12.5px] uppercase tracking-[0.14em] text-nnm-gold">
              Counter 01A
            </span>
            <h1 className="mb-3 font-display text-3xl font-semibold sm:text-4xl">Nagar Nigam Shops</h1>
            <p className="max-w-xl text-[17px] text-white/80">
              Everything related to municipal shops and stalls — rent payment, new applications, and your own shop
              records.
            </p>
          </div>
        </section>

        <section className="bg-paper-dim py-14">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {options.map((opt) => (
                <Link
                  key={opt.href}
                  href={opt.href}
                  className="rounded-[10px] border border-line bg-card transition-shadow hover:shadow-md"
                >
                  <div className="px-5 py-3.5">
                    <opt.icon className="h-[22px] w-[22px] text-nnm-blue" strokeWidth={1.8} />
                  </div>
                  <div className="perforation" />
                  <div className="px-5 pb-[22px] pt-[18px]">
                    <h3 className="mb-2 text-[16.5px] font-semibold text-ink">{opt.title}</h3>
                    <p className="mb-[18px] min-h-[58px] text-[13.8px] text-ink-soft">{opt.description}</p>
                    <span className="inline-flex items-center gap-2 rounded-md bg-nnm-gold px-4 py-2.5 text-[13px] font-semibold text-[#20240a] shadow-[0_3px_0_#96791b]">
                      {opt.cta}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
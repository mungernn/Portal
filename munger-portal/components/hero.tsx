import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROPERTY_TAX_SEARCH_PATH } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-nnm-blue to-nnm-blue-dark pt-24 text-white">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="max-w-xl">
          <span className="mb-5 block font-mono text-sm uppercase tracking-[0.16em] text-nnm-gold">
            Municipal Corporation · Government of Bihar
          </span>
          <h1 className="mb-1.5 font-display text-[clamp(34px,5vw,54px)] font-semibold leading-[1.05]">
            मुंगेर नगर निगम
          </h1>
          <p className="mb-7 font-mono text-sm uppercase tracking-[0.14em] text-white/70">
            Munger Nagar Nigam — Citizen Services Portal
          </p>
          <p className="mb-8 max-w-lg text-[17px] text-white/80">
            Civic services for the city of Munger — property tax, sanitation,
            water supply, and public records, brought online one counter at
            a time.
          </p>
          <div className="mb-14 flex flex-wrap gap-3.5">
            <Link
              href={PROPERTY_TAX_SEARCH_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-nnm-gold px-6 py-3 text-[14.5px] font-semibold text-[#20240a] shadow-[0_3px_0_#96791b] transition-transform hover:-translate-y-px"
            >
              Pay Property Tax <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center gap-2 rounded-md border-[1.5px] border-white/55 px-6 py-3 text-[14.5px] font-semibold text-white transition-colors hover:border-white"
            >
              See all services
            </Link>
          </div>
        </div>
      </div>
      <div className="tear" />
    </section>
  );
}

const LINES: { k: string; v: React.ReactNode }[] = [
  {
    k: "Address",
    v: (
      <>
        <span className="rounded bg-[#fff4cf] px-1.5 py-0.5">
          [Office address]
        </span>
        , Munger, Bihar –{" "}
        <span className="rounded bg-[#fff4cf] px-1.5 py-0.5">[PIN]</span>
      </>
    ),
  },
  {
    k: "Phone",
    v: (
      <span className="rounded bg-[#fff4cf] px-1.5 py-0.5">
        [Office phone number]
      </span>
    ),
  },
  {
    k: "Email",
    v: (
      <span className="rounded bg-[#fff4cf] px-1.5 py-0.5">
        [Office email]
      </span>
    ),
  },
  { k: "Hours", v: "Monday – Saturday, 10:00 AM – 5:00 PM" },
];

export function Contact() {
  return (
    <section id="contact" className="py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-2">
        <div>
          <span className="mb-2.5 block font-mono text-[12.5px] uppercase tracking-[0.14em] text-ganga-teal">
            Get in touch
          </span>
          <h2 className="mb-4 font-display text-3xl font-semibold text-ink">
            Visit or reach us
          </h2>
          <p className="max-w-md text-[17px] text-ink-soft">
            For anything not yet available online, the Nigam office handles
            it at the counter — in person or by phone or through email at: munger.ulb@gmail.com
          </p>
        </div>
        <div className="rounded-[10px] border border-line bg-card p-7">
          {LINES.map((line) => (
            <div key={line.k} className="mb-4 flex gap-3 text-[14.5px] last:mb-0">
              <span className="w-[90px] shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ganga-teal">
                {line.k}
              </span>
              <span>{line.v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

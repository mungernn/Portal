export function About() {
  return (
    <section id="about" className="py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
        <div>
          <span className="mb-2.5 block font-mono text-[12.5px] uppercase tracking-[0.14em] text-ganga-teal">
            About the corporation
          </span>
          <h2 className="mb-4 font-display text-3xl font-semibold text-ink">
            Running the city, ward by ward
          </h2>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Munger Nagar Nigam is the urban local body responsible for civic
            administration across the city&apos;s wards — property assessment
            and tax collection, solid waste management, water supply, and
            local infrastructure. The Corporation is moving these services
            online, starting with a digital counter for property tax that
            replaces paper registers with instant lookups and printed
            receipts.
          </p>
        </div>
        <div className="rounded-[10px] border border-line bg-card p-7">
          <h3 className="mb-2.5 text-base font-semibold text-ink">
            What&apos;s live today
          </h3>
          <p className="text-[14.5px] text-ink-soft">
            The Property Tax Counter is live for operators at NNM offices —
            look up a holding number, auto-calculate the year&apos;s tax,
            collect payment, and issue a receipt or demand notice on the
            spot. More citizen-facing services are being added to this site
            as they come online.
          </p>
        </div>
      </div>
    </section>
  );
}

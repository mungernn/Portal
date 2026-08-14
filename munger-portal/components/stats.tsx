import { stats } from "@/lib/config";

export function Stats() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-6 py-7 text-center">
              <span className="block font-mono text-3xl font-semibold text-nnm-blue">
                {s.value}
              </span>
              <span className="mt-1.5 block text-[13px] text-ink-soft">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Desk-wise pending work: one column per desk (officer), each with its pending counts - for monitoring where files
 * are waiting. A desk's own login is highlighted.
 */
export interface Desk {
  desk: string;
  /** Role whose login this desk is - highlighted for that login. */
  role?: string;
  items: { label: string; count: number }[];
}

export function DeskPanel({ title, desks, myRole, note }: { title: string; desks: Desk[]; myRole?: string; note?: string }) {
  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold text-slate-800">{title}</h2>
      {note && <p className="mb-2 text-xs text-slate-500">{note}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {desks.map((d) => {
          const total = d.items.reduce((n, i) => n + i.count, 0);
          const mine = !!myRole && d.role === myRole;
          return (
            <div key={d.desk} className={`rounded-lg border p-3 ${mine ? "border-nnm-blue bg-blue-50/60" : "border-slate-200"}`}>
              <p className="text-xs font-semibold text-slate-600">
                {d.desk}
                {mine ? " (you)" : ""}
              </p>
              <p className={`text-2xl font-semibold ${total ? "text-red-700" : "text-slate-400"}`}>{total.toLocaleString("en-IN")}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                {d.items.map((i) => (
                  <li key={i.label} className="flex justify-between gap-2">
                    <span>{i.label}</span>
                    <span className={i.count ? "font-semibold text-slate-900" : "text-slate-400"}>{i.count.toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

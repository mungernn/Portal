"use client";

import { FileText, Sparkles, HelpCircle } from "lucide-react";

export type NewEntryChoice = "known-number" | "new" | "partiallyKnown";

export function EntryModePicker({ onChoose }: { onChoose: (choice: NewEntryChoice) => void }) {
  const options: {
    choice: NewEntryChoice;
    icon: typeof FileText;
    title: string;
    description: string;
  }[] = [
    {
      choice: "known-number",
      icon: FileText,
      title: "MUNG- series — already exists online",
      description: "This holding already has a digitized record with a fixed number (e.g. MUNG-08257). Type its exact number.",
    },
    {
      choice: "new",
      icon: Sparkles,
      title: "MMC- series — completely new",
      description: "No offline history at all. A genuinely new property with a full floor survey. Number is auto-assigned.",
    },
    {
      choice: "partiallyKnown",
      icon: HelpCircle,
      title: "MUNGMC- series — offline register only",
      description:
        "Existed in the offline demand register but was never taken online — only ARV for one or more past phases survives, no floor survey. Number is auto-assigned.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {options.map(({ choice, icon: Icon, title, description }) => (
        <button
          key={choice}
          type="button"
          onClick={() => onChoose(choice)}
          className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </button>
      ))}
    </div>
  );
}
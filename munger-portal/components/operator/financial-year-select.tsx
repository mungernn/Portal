"use client";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";

export interface FinancialYearSelectProps {
  value: string; // "YYYY-YYYY", or "" if allowBlank and unset
  onChange: (value: string) => void;
  /** Calendar year the range starts at, e.g. 1990 → first option is "1990-1991". */
  startYear: number;
  /** Calendar year the range ends at (inclusive), e.g. 2027 → last option is "2027-2028". */
  endYear: number;
  allowBlank?: boolean;
  blankLabel?: string;
  className?: string;
  required?: boolean;
}

/** Builds ["2027-2028", "2026-2027", ..., "1990-1991"] — most recent first. */
function buildYearOptions(startYear: number, endYear: number): string[] {
  const options: string[] = [];
  for (let y = endYear; y >= startYear; y--) {
    options.push(`${y}-${y + 1}`);
  }
  return options;
}

export function FinancialYearSelect({
  value,
  onChange,
  startYear,
  endYear,
  allowBlank = false,
  blankLabel = "Not set",
  className,
  required,
}: FinancialYearSelectProps) {
  const options = buildYearOptions(startYear, endYear);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={className ?? inputClass}
    >
      {allowBlank && <option value="">{blankLabel}</option>}
      {options.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
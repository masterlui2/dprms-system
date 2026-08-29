interface SummaryItemProps {
  label: string;
  value: string;
  wide?: boolean;
}

export function SummaryItem({ label, value, wide = false }: SummaryItemProps) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

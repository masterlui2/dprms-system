import type { LucideIcon } from 'lucide-react'

import { cn } from '../../utils/cn'

type MetricTone = 'blue' | 'gold' | 'orange' | 'sky' | 'green' | 'red' | 'indigo'

const toneClasses: Record<MetricTone, string> = {
  blue: 'bg-blue-50 text-[#0f53b7]',
  gold: 'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600',
  sky: 'bg-sky-50 text-sky-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
}

interface MetricCardProps {
  detail: string
  icon: LucideIcon
  label: string
  tone?: MetricTone
  value: string | number
  valueType?: 'numeric' | 'text'
}

function looksNumeric(value: string): boolean {
  return /^(?:[₱$€£]\s*)?[+-]?\d[\d,.]*(?:\s*\/\s*\d[\d,.]*)?(?:\s*(?:%|[KMB]))?$/i.test(value.trim())
}

export function MetricCard({
  detail,
  icon: Icon,
  label,
  tone = 'blue',
  value,
  valueType,
}: MetricCardProps) {
  const strValue = String(value)
  const isNumeric = valueType === 'numeric'
    || (valueType !== 'text' && looksNumeric(strValue))

  return (
    <article className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-slate-200 hover:shadow-[0_8px_30px_-6px_rgba(15,23,42,0.1)]">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105',
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-700">
            {label}
          </p>
          {detail ? (
            <p className="truncate text-xs text-slate-400 mt-0.5">
              {detail}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-right pl-2">
        <p
          className={cn(
            'font-bold tracking-tight text-slate-900',
            isNumeric
              ? 'numeric-value text-2xl lg:text-3xl tabular-nums'
              : 'text-base sm:text-lg',
          )}
          data-value-type={isNumeric ? 'numeric' : 'text'}
        >
          {strValue}
        </p>
      </div>
    </article>
  )
}

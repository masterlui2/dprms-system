import type { LucideIcon } from 'lucide-react'

import { cn } from '../../utils/cn'

type MetricTone = 'blue' | 'gold' | 'orange' | 'sky' | 'green' | 'red' | 'indigo' | 'purple'

const toneClasses: Record<MetricTone, string> = {
  blue: 'bg-blue-50 text-[#0f53b7]',
  gold: 'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600',
  sky: 'bg-sky-50 text-sky-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  purple: 'bg-purple-50 text-purple-600',
}

interface MetricCardProps {
  detail?: string
  icon: LucideIcon
  label: string
  onClick?: () => void
  tone?: MetricTone
  trend?: string
  trendTone?: 'up' | 'down' | 'neutral'
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
  onClick,
  tone = 'blue',
  trend,
  trendTone,
  value,
  valueType,
}: MetricCardProps) {
  const strValue = String(value)
  const isNumeric = valueType === 'numeric'
    || (valueType !== 'text' && looksNumeric(strValue))

  const isPositive = trendTone === 'up' || (trendTone !== 'down' && (trend?.includes('+') || trend?.includes('↗')))
  const isNegative = trendTone === 'down' || (trendTone !== 'up' && (trend?.includes('-') || trend?.includes('↘')))

  const trendIcon = isPositive ? '↗' : isNegative ? '↘' : ''
  const displayTrend = trend
    ? (trend.startsWith('↗') || trend.startsWith('↘') ? trend : `${trendIcon} ${trend}`.trim())
    : null

  return (
    <article
      className={cn(
        'group flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_8px_30px_-6px_rgba(15,23,42,0.08)]',
        onClick && 'cursor-pointer active:scale-[0.99]',
      )}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-slate-800 line-clamp-2" title={label}>
            {label}
          </p>
          {detail ? (
            <p className="mt-0.5 text-xs font-medium leading-tight text-slate-400 line-clamp-1" title={detail}>
              {detail}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'font-black leading-none tracking-tight text-slate-900',
            isNumeric
              ? 'numeric-value whitespace-nowrap text-2xl sm:text-3xl tabular-nums'
              : 'text-base sm:text-lg',
          )}
          data-value-type={isNumeric ? 'numeric' : 'text'}
        >
          {strValue}
        </p>

        {displayTrend ? (
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-0.5 text-xs font-bold tabular-nums',
              isPositive && 'text-emerald-600',
              isNegative && 'text-rose-600',
              !isPositive && !isNegative && 'text-slate-500',
            )}
          >
            {displayTrend}
          </span>
        ) : null}
      </div>
    </article>
  )
}

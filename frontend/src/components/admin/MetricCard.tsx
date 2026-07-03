import type { LucideIcon } from 'lucide-react'

import { cn } from '../../utils/cn'

type MetricTone = 'blue' | 'gold' | 'orange' | 'sky' | 'green' | 'red'

const toneClasses: Record<MetricTone, string> = {
  blue: 'bg-[#0f53b7] text-white',
  gold: 'bg-[#f5c84c] text-[#17345f]',
  orange: 'bg-[#ff8a1f] text-white',
  sky: 'bg-[#e4f1ff] text-[#0a3f8d]',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
}

interface MetricCardProps {
  detail: string
  icon: LucideIcon
  label: string
  tone?: MetricTone
  value: string
}

export function MetricCard({
  detail,
  icon: Icon,
  label,
  tone = 'blue',
  value,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-[#d8e1ee] bg-white p-5 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#073b82]">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-2xl',
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </article>
  )
}

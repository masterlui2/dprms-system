import { cn } from '../../utils/cn'

export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

const toneClasses: Record<StatusTone, string> = {
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-600',
  info: 'text-[#0f53b7]',
  neutral: 'text-slate-600',
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: string
  tone?: StatusTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-bold',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}

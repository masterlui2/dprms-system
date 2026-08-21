type StatusBadgeProps = {
  children: string
  tone?: 'success' | 'warning' | 'neutral'
}

const toneClasses = {
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  neutral: 'text-slate-600',
} satisfies Record<NonNullable<StatusBadgeProps['tone']>, string>

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      className={`text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

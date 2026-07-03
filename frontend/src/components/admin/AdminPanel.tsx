import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface AdminPanelProps {
  action?: ReactNode
  children: ReactNode
  className?: string
  description?: string
  title: string
}

export function AdminPanel({
  action,
  children,
  className,
  description,
  title,
}: AdminPanelProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]',
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-[#d8e1ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#073b82]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  action?: ReactNode
  description: string
  eyebrow?: string
  title: string
}

export function AdminPageHeader({
  action,
  description,
  eyebrow,
  title,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-black tracking-tight text-[#073b82] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

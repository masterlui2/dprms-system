import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface AnimatedTabItem {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
  count?: number | string
}

interface AnimatedTabsProps {
  tabs: AnimatedTabItem[]
  activeTab: string
  onChange: (id: string) => void
  layoutId?: string
  className?: string
  pillColor?: string
  variant?: 'pill' | 'underline'
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  layoutId = 'animated-tab',
  className,
  pillColor = 'bg-[#0f53b7]',
  variant = 'pill',
}: AnimatedTabsProps) {
  if (variant === 'underline') {
    return (
      <div
        className={cn(
          'relative flex items-center gap-5 overflow-x-auto border-b border-[#B5BFCD]/40 pb-px scrollbar-none',
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 pb-2.5 pt-1 text-xs font-bold transition-colors duration-200 outline-none shrink-0 cursor-pointer',
                isActive ? 'text-[#0f53b7]' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {Icon && <Icon className="size-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums transition-colors',
                    isActive
                      ? 'bg-blue-100/80 text-[#0f53b7]'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 35,
                  }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#0f53b7]"
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-1 rounded-full bg-[#EAF1F8] p-1 border border-[#C5D5E7]/80 shadow-xs',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-colors duration-200 outline-none cursor-pointer',
              isActive
                ? 'text-white'
                : 'text-slate-600 hover:text-[#0f53b7]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                }}
                className={cn('absolute inset-0 rounded-full shadow-sm', pillColor)}
                style={{ zIndex: -1 }}
              />
            )}
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-[#285497] border border-[#B5BFCD]/40 shadow-xs'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

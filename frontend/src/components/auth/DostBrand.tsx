import { Link } from 'react-router-dom'

import logoImage from '../../assets/logo2.png'
import { cn } from '../../utils/cn'

interface DostBrandProps {
  className?: string
  inverted?: boolean
}

export function DostBrand({
  className,
  inverted = false,
}: DostBrandProps) {
  return (
    <Link
      aria-label="DOST MSME Monitoring Portal home"
      className={cn(
        'inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4',
        inverted
          ? 'focus-visible:ring-white/30'
          : 'focus-visible:ring-blue-100',
        className,
      )}
      to="/"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
        <img
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-24 w-24 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
          src={logoImage}
        />
      </div>
      <div className="leading-tight">
        <p
          className={cn(
            'text-lg font-black',
            inverted ? 'text-white' : 'text-[#073b82]',
          )}
        >
          DOST XI
        </p>
        <p
          className={cn(
            'mt-1 hidden text-[11px] font-bold uppercase tracking-[0.16em] sm:block',
            inverted ? 'text-blue-100' : 'text-slate-500',
          )}
        >
          MSME Monitoring Portal
        </p>
      </div>
    </Link>
  )
}

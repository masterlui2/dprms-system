import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalShellProps {
  children: ReactNode
  description?: string
  footer?: ReactNode
  onClose: () => void
  title: string
  width?: 'md' | 'lg' | 'xl'
}

const widths = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

export function ModalShell({
  children,
  description,
  footer,
  onClose,
  title,
  width = 'lg',
}: ModalShellProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      aria-labelledby="admin-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <div
        className={`flex max-h-[94vh] w-full ${widths[width]} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <header className="flex items-start gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              className="text-xl font-black text-[#073b82]"
              id="admin-modal-title"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Close modal"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer ? (
          <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}

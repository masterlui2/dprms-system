import { useEffect, useRef } from 'react'
import { Send, X } from 'lucide-react'

import { Button } from '../ui/button'

interface ConfirmationDialogProps {
  isOpen: boolean
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({
  isOpen,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement as HTMLElement | null
    confirmButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [isOpen, isSubmitting, onCancel])

  if (!isOpen) return null

  return (
    <div
      aria-labelledby="confirmation-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#073b82]" id="confirmation-title">
              Submit this proposal?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your proposal will enter the DOST review queue. Make sure all information and
              documents are correct before continuing.
            </p>
          </div>
          <button
            aria-label="Close confirmation"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            className="h-11"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Review Again
          </Button>
          <Button
            className="h-11"
            disabled={isSubmitting}
            onClick={onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            <Send className="size-4" />
            {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
          </Button>
        </div>
      </div>
    </div>
  )
}

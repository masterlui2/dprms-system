import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FolderPlus, X } from 'lucide-react'
import type { Program } from '../../services/projectStore'

interface LegacyProjectModalProps {
  program: Program
  onClose: () => void
}

const inputClassName = 'h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100'
const labelClassName = 'flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700'

/** A presentation-only form for projects approved before DPRMS. */
export function LegacyProjectModal({ program, onClose }: LegacyProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const backdropPointerRef = useRef(false)
  const id = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow

    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    titleInputRef.current?.focus()

    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[640px] overflow-hidden rounded-2xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-[3px]"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onPointerDown={(event) => {
        backdropPointerRef.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (backdropPointerRef.current && event.target === event.currentTarget) onClose()
        backdropPointerRef.current = false
      }}
    >
      <form
        className="flex max-h-[calc(100dvh_-_2rem)] flex-col"
        onSubmit={(event) => event.preventDefault()}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0f53b7]">
            <FolderPlus aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight text-slate-900">Add legacy project</h2>
            <p id={`${id}-description`} className="mt-1 text-sm text-slate-500">For projects approved before DPRMS.</p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-100"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-[#0f53b7]">{program}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
              Active project
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className={`${labelClassName} sm:col-span-2`}>
              Project title
              <input ref={titleInputRef} name="projectTitle" type="text" placeholder="Enter project title" className={inputClassName} />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              {program === 'GIA' ? 'Implementing agency' : 'Enterprise name'}
              <input name="organizationName" type="text" placeholder={program === 'GIA' ? 'Enter agency name' : 'Enter enterprise name'} className={inputClassName} />
            </label>
            <label className={labelClassName}>
              <span>Reference no. <span className="font-normal text-slate-400">(optional)</span></span>
              <input name="referenceNumber" type="text" placeholder={`${program}-2023-001`} className={inputClassName} />
            </label>
            <label className={labelClassName}>
              Approved funding
              <span className="relative block">
                <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-normal text-slate-400">₱</span>
                <input name="approvedFunding" aria-label="Approved funding in Philippine pesos" type="number" min="0" step="0.01" placeholder="0.00" className={`${inputClassName} pl-8`} />
              </span>
            </label>
            <label className={labelClassName}>
              Start date
              <input name="startDate" type="date" className={inputClassName} />
            </label>
            <label className={labelClassName}>
              End date
              <input name="endDate" type="date" className={inputClassName} />
            </label>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <span id={`${id}-preview`} className="text-xs text-slate-400">Preview only · Nothing is saved</span>
          <div className="ml-auto flex items-center gap-2.5">
            <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-100">Cancel</button>
            <button type="submit" disabled aria-describedby={`${id}-preview`} className="h-10 cursor-not-allowed rounded-xl bg-[#0f53b7] px-4 text-sm font-semibold text-white opacity-60">Add project</button>
          </div>
        </footer>
      </form>
    </dialog>,
    document.body,
  )
}

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, FolderCog, FolderOpen, LoaderCircle, RotateCcw } from 'lucide-react'
import type { MockUser } from '../../lib/mockAuth'
import {
  chooseCustomDownloadDirectory, chooseDefaultDownloadRoot, getCachedDownloadDirectoryState,
  getDownloadDirectoryState, resetDownloadDirectory, saveDownloadSubpath,
  type DownloadDirectoryState,
} from '../../services/downloadManager'
import { ModalShell } from '../admin/ModalShell'

export function ExportDirectorySettings({ user }: { user: MockUser }) {
  const [directory, setDirectory] = useState(() => getCachedDownloadDirectoryState(user))
  const [path, setPath] = useState(directory.customSubpath)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const identity = `${user.id ?? user.email}:${user.role}:${user.program ?? ''}`

  useEffect(() => {
    let active = true
    getDownloadDirectoryState(user).then((state) => {
      if (active) { setDirectory(state); setPath(state.customSubpath) }
    }).catch(() => {
      if (active) setError('Your saved folder could not be loaded. Downloads can still use the browser destination.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // The account identity, rather than the newly read user object, controls hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity])

  async function change(action: string, operation: () => Promise<DownloadDirectoryState>) {
    setPending(action); setError(null); setNotice(null)
    try {
      const state = await operation()
      setDirectory(state); setPath(state.customSubpath)
      setNotice(action === 'reset' ? 'Default destination restored.' : 'Export directory saved for this account.')
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === 'AbortError') {
        setNotice('Folder selection canceled. Your destination is unchanged.')
      } else {
        setError(failure instanceof Error ? failure.message : 'The folder could not be saved.')
      }
    } finally { setPending(null) }
  }

  const disabled = loading || pending !== null || !directory.browserSupported || directory.authorizedPrograms.length === 0
  const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-[#f3f8fe] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current destination</span>
          <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-semibold text-[#073b82]">
            Authorized: {directory.authorizedPrograms.join(' & ') || 'No assigned program'}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 size-5 shrink-0 text-[#0f53b7]" />
          <p className="break-all text-sm font-semibold leading-6 text-slate-800">{directory.activePath}</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {directory.mode === 'custom' ? 'Custom destination' : 'Default destination'} · Applies to documents, reports, exports, and attachments.
        </p>
      </div>

      {!directory.browserSupported ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This browser uses its standard download destination. Use a browser with folder access, such as desktop Chrome or Edge, to enable GIA / SETUP folders.</p>
      ) : directory.configured && directory.permission !== 'granted' && !loading ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Folder access needs confirmation. Your browser may ask for permission on your next download. If access is unavailable, the file goes to browser downloads.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button className={`${buttonClass} bg-[#0f53b7] text-white hover:bg-[#073b82]`} disabled={disabled}
          onClick={() => void change('browse', () => directory.configured ? chooseCustomDownloadDirectory(user) : chooseDefaultDownloadRoot(user))} type="button">
          {pending === 'browse' ? <LoaderCircle className="size-4 animate-spin" /> : <FolderOpen className="size-4" />}
          Browse / Change folder
        </button>
        <button className={`${buttonClass} border border-slate-200 text-slate-700 hover:bg-slate-50`} disabled={disabled}
          onClick={() => void change('reset', () => resetDownloadDirectory(user))} type="button">
          {pending === 'reset' ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
          Reset to default
        </button>
      </div>

      <form className="space-y-2 border-t border-slate-100 pt-5" onSubmit={(event) => { event.preventDefault(); if (!disabled) void change('save', () => saveDownloadSubpath(user, path)) }}>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="export-subfolder">Subfolder path <span className="font-normal text-slate-400">(optional)</span></label>
        <div className="flex gap-2">
          <input aria-describedby="export-path-help" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50" disabled={disabled || !directory.configured}
            id="export-subfolder" onChange={(event) => setPath(event.target.value)} placeholder="Reports/2026" value={path} />
          <button className={`${buttonClass} border border-slate-200 text-[#073b82] hover:bg-blue-50`} disabled={disabled || !directory.configured} type="submit">
            {pending === 'save' ? <LoaderCircle className="size-4 animate-spin" /> : null}Save
          </button>
        </div>
        <p className="text-xs leading-5 text-slate-500" id="export-path-help">Choose a parent folder first, then type a path inside it. Files go into its authorized GIA / SETUP subfolders. To use another drive or an absolute path, select it through Browse.</p>
      </form>

      <div aria-live="polite">
        {loading ? <p className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" />Checking saved folder…</p> : null}
        {notice ? <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{notice}</p> : null}
        {error ? <p className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</p> : null}
      </div>
      <p className="text-xs leading-5 text-slate-500">Your first chosen folder is the default for this account in this browser. Reset restores it. Canceling a folder picker during a download sends the file to browser downloads. Browsers show folder names here, rather than the full device path.</p>
    </div>
  )
}

export function AccountExportDirectory({ user }: { user: MockUser }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return <>
    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#073b82]" onClick={() => setOpen(true)} type="button">
      <FolderCog className="size-4 shrink-0 text-[#0f53b7]" />Export directory
    </button>
    {open ? createPortal(
      <ModalShell description="Choose where your DPRMS files are saved." onClose={close} title="Report Export Directory" width="md">
        <ExportDirectorySettings key={`${user.id ?? user.email}:${user.role}:${user.program ?? ''}`} user={user} />
      </ModalShell>, document.body,
    ) : null}
  </>
}

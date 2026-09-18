import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Folder,
  Info,
  LoaderCircle,
  RotateCcw,
  Settings,
} from 'lucide-react'
import type { MockUser } from '../../lib/mockAuth'
import { ROLE_LABEL } from '../../config/permissions'
import { cn } from '../../utils/cn'
import {
  chooseCustomDownloadDirectory,
  chooseDefaultDownloadRoot,
  getCachedDownloadDirectoryState,
  getDownloadDirectoryState,
  resetDownloadDirectory,
  saveDownloadSubpath,
  type DownloadDirectoryState,
} from '../../services/downloadManager'
import { ModalShell } from '../admin/ModalShell'

export function ExportDirectorySettings({ user }: { user: MockUser }) {
  const [directory, setDirectory] = useState(() => getCachedDownloadDirectoryState(user))
  const [subfolder, setSubfolder] = useState(directory.customSubpath)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getDownloadDirectoryState(user)
      .then((state) => {
        if (active) {
          setDirectory(state)
          setSubfolder(state.customSubpath)
        }
      })
      .catch(() => {
        if (active) setError('Could not load download folder.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  async function update(action: string, fn: () => Promise<DownloadDirectoryState>) {
    setPending(action)
    setError(null)
    setNotice(null)
    try {
      const state = await fn()
      setDirectory(state)
      setSubfolder(state.customSubpath)
      setNotice(action === 'reset' ? 'Restored to default folder.' : 'Settings saved successfully.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to apply settings.')
    } finally {
      setPending(null)
    }
  }

  const disabled = loading || pending !== null || !directory.browserSupported

  return (
    <div className="space-y-4 font-sans">
      <section className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-full bg-[#0f53b7] text-sm font-bold text-white shadow-xs shrink-0">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-slate-900">{user.name}</h4>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-8 border-t border-slate-200/80 pt-2.5 text-xs">
          <div>
            <span className="block text-[11px] font-medium text-slate-400">Role</span>
            <span className="font-semibold text-slate-700">{ROLE_LABEL[user.role] ?? user.role}</span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-400">Program</span>
            <span className="font-semibold text-slate-700">{user.program || 'All Programs'}</span>
          </div>
          {user.applicationReference ? (
            <div>
              <span className="block text-[11px] font-medium text-slate-400">Application Reference</span>
              <span className="font-mono font-semibold text-slate-700">{user.applicationReference}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!disabled) void update('save', () => saveDownloadSubpath(user, subfolder))
          }}
        >
          <div className="flex items-center gap-2">
            <Folder className="size-4 text-[#0f53b7]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Downloads</h3>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="downloads-location">
              Save files to
            </label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-slate-300 bg-slate-100 px-3 overflow-hidden">
                <Folder className="mr-2 size-4 shrink-0 text-slate-400" />
                <input
                  className="h-10 min-w-0 flex-1 bg-transparent font-mono text-xs text-slate-700 outline-none select-all cursor-default"
                  id="downloads-location"
                  readOnly
                  type="text"
                  value={directory.activePath}
                />
              </div>
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                disabled={disabled}
                onClick={() =>
                  void update('browse', () =>
                    directory.configured
                      ? chooseCustomDownloadDirectory(user)
                      : chooseDefaultDownloadRoot(user),
                  )
                }
                type="button"
              >
                {pending === 'browse' ? (
                  <LoaderCircle className="size-4 animate-spin text-[#0f53b7]" />
                ) : (
                  'Choose...'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="subfolder-path">
              Subfolder <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              className={cn(
                'h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-800 outline-none',
                'placeholder:font-sans placeholder:text-slate-400',
                'focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50',
              )}
              disabled={disabled || !directory.configured}
              id="subfolder-path"
              onChange={(e) => setSubfolder(e.target.value)}
              placeholder="e.g. Reports/2026"
              type="text"
              value={subfolder}
            />
          </div>

          {!directory.browserSupported ? (
            <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
              <Info className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <span>
                Default folder active. To select a custom folder, enable File System Access in Brave
                (<code className="text-[11px]">brave://flags/#file-system-access-api</code>) or use Chrome/Edge.
              </span>
            </div>
          ) : null}

          {notice ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{notice}</span>
            </div>
          ) : null}

          {error ? (
            <div
              className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-800"
              role="alert"
            >
              <AlertTriangle className="size-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            {directory.configured ? (
              <button
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800 disabled:opacity-50"
                disabled={disabled}
                onClick={() => void update('reset', () => resetDownloadDirectory(user))}
                type="button"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset to default</span>
              </button>
            ) : (
              <div />
            )}
            <button
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-lg bg-[#0f53b7] px-5',
                'text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] disabled:opacity-50',
              )}
              disabled={disabled}
              type="submit"
            >
              {pending === 'save' ? <LoaderCircle className="mr-1.5 size-3.5 animate-spin" /> : null}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function AccountExportDirectory({ user }: { user: MockUser }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#073b82]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Settings className="size-4 shrink-0 text-slate-500" />
        <span>Settings</span>
      </button>
      {open
        ? createPortal(
            <ModalShell
              description="Manage account profile and download preferences."
              onClose={close}
              title="Settings"
              width="md"
            >
              <ExportDirectorySettings user={user} />
            </ModalShell>,
            document.body,
          )
        : null}
    </>
  )
}

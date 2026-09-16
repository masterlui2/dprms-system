import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FolderCog,
  FolderOpen,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react'

import { getMockUser } from '../../lib/mockAuth'
import {
  chooseCustomDownloadDirectory,
  chooseDefaultDownloadRoot,
  getDownloadDirectoryState,
  resetDownloadDirectory,
  type DownloadDirectoryState,
} from '../../services/downloadManager'

export function FileSettingsPage() {
  const user = useMemo(() => getMockUser(), [])
  const [directoryState, setDirectoryState] = useState<DownloadDirectoryState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<'change' | 'reset' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const programLabel = useMemo(() => {
    const programs = directoryState?.authorizedPrograms ?? []
    if (programs.length === 0) return 'No assigned program'
    return programs.join(' and ')
  }, [directoryState?.authorizedPrograms])

  useEffect(() => {
    let cancelled = false

    async function loadState() {
      if (!user) return
      try {
        const nextState = await getDownloadDirectoryState(user)
        if (!cancelled) setDirectoryState(nextState)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'File settings could not be loaded.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadState()
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleChangeFolder() {
    if (!user || !directoryState) return
    setActiveAction('change')
    setError(null)
    setMessage(null)
    try {
      const nextState = directoryState.configured
        ? await chooseCustomDownloadDirectory(user)
        : await chooseDefaultDownloadRoot(user)
      setDirectoryState(nextState)
      setMessage('Your download folder has been updated.')
    } catch (actionError) {
      if (!(actionError instanceof DOMException && actionError.name === 'AbortError')) {
        setError(actionError instanceof Error ? actionError.message : 'The folder could not be selected.')
      }
    } finally {
      setActiveAction(null)
    }
  }

  async function handleReset() {
    if (!user || !directoryState) return
    setActiveAction('reset')
    setError(null)
    setMessage(null)
    try {
      const nextState = await resetDownloadDirectory(user)
      setDirectoryState(nextState)
      setMessage('The role-based default download folder has been restored.')
    } catch (actionError) {
      if (!(actionError instanceof DOMException && actionError.name === 'AbortError')) {
        setError(actionError instanceof Error ? actionError.message : 'The default folder could not be restored.')
      }
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 font-sans">
      <header className="flex items-start gap-3">
        <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-[#0f53b7]" />
        <div>
          <p className="text-xs font-semibold text-[#285497]">Downloads</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            File Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage where documents, reports, exports, and attachments are saved.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
        <div className="border-b border-slate-200 bg-[#f8fbff] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
              <FolderCog className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Download folder</h2>
              <p className="text-xs text-slate-500">Account-specific folder preference</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="size-5 animate-spin text-[#0f53b7]" />
              Loading file settings…
            </div>
          ) : directoryState ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current directory</p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                    {directoryState.activePath}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Authorized folders</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{programLabel}</p>
                </div>
              </div>

              {!directoryState.browserSupported ? (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  This browser uses its standard Downloads folder. Direct folder selection is available in supported Chrome or Edge environments.
                </div>
              ) : null}

              {message ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-700" role="alert">
                  <AlertTriangle className="size-4" />
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-semibold text-white transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!directoryState.browserSupported || activeAction !== null}
                  onClick={() => void handleChangeFolder()}
                  type="button"
                >
                  {activeAction === 'change' ? <LoaderCircle className="size-4 animate-spin" /> : <FolderOpen className="size-4" />}
                  {directoryState.configured ? 'Change folder' : 'Choose folder'}
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!directoryState.browserSupported || activeAction !== null}
                  onClick={() => void handleReset()}
                  type="button"
                >
                  {activeAction === 'reset' ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                  Reset to default
                </button>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                On first use, select a parent folder once. DPRMS creates the authorized {programLabel} folder structure and remembers it for future sessions.
              </p>
            </>
          ) : (
            <p className="flex min-h-32 items-center justify-center gap-2 text-sm font-semibold text-rose-700" role="alert">
              <AlertTriangle className="size-4" />
              {error ?? 'File settings could not be loaded.'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

/**
 * System: DPRMS
 * Purpose: Render export directory settings for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    CheckCircle2,
    FolderCog,
    FolderOpen,
    LoaderCircle,
    RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MockUser } from '../../lib/mock_auth';
import
{
    chooseCustomDownloadDirectory,
    chooseDefaultDownloadRoot,
    getCachedDownloadDirectoryState,
    getDownloadDirectoryState,
    resetDownloadDirectory,
    saveDownloadSubpath,
    type DownloadDirectoryState,
} from '../../services/download_manager';
import { reportError } from '../../utils/error_reporting';
import { ModalShell } from '../admin/ModalShell';

/** Render export directory settings and its available actions. */
export function ExportDirectorySettings({ objUser }: { objUser: MockUser; })
{
    const [objDirectory, setObjDirectory] = useState(() =>
        getCachedDownloadDirectoryState(objUser),
    );
    const [strPath, setStrPath] = useState(objDirectory.customSubpath);
    const [blnLoading, setBlnLoading] = useState(true);
    const [strPending, setStrPending] = useState<string | null>(null);
    const [strNotice, setStrNotice] = useState<string | null>(null);
    const [strError, setStrError] = useState<string | null>(null);
    const strIdentity = `${objUser.id ?? objUser.email}:${objUser.role}:${objUser.program ?? ''}`;

    // The stable account identity controls hydration; user objects are recreated by callers.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(
        () =>
        {
            let blnActive = true;
            getDownloadDirectoryState(objUser)
                .then((objState) =>
                {
                    if (blnActive)
                    {
                        setObjDirectory(objState);
                        setStrPath(objState.customSubpath);
                    }
                })
                .catch(() =>
                {
                    if (blnActive)
                    {
                        setStrError(
                            'Your saved folder could not be loaded. Downloads can still use the browser destination.',
                        );
                    }
                })
                .finally(() =>
                {
                    if (blnActive)
                    {
                        setBlnLoading(false);
                    }
                });
            return () =>
            {
                blnActive = false;
            };
        } /* end ExportDirectorySettings */,
        [strIdentity],
    );
    /* eslint-enable react-hooks/exhaustive-deps */

    /** Change. */
    async function _change(strAction: string, operation: () => Promise<DownloadDirectoryState>)
    {
        setStrPending(strAction);
        setStrError(null);
        setStrNotice(null);
        try
        {
            const objState = await operation();
            setObjDirectory(objState);
            setStrPath(objState.customSubpath);
            setStrNotice(
                strAction === 'reset'
                    ? 'Default destination restored.'
                    : 'Export directory saved for this account.',
            );
        } catch (errFailure)
        {
            reportError(errFailure, 'ExportDirectorySettings: change failed.');

            if (errFailure instanceof DOMException && errFailure.name === 'AbortError')
            {
                setStrNotice('Folder selection canceled. Your destination is unchanged.');
            } else
            {
                setStrError(
                    errFailure instanceof Error
                        ? errFailure.message
                        : 'The folder could not be saved.',
                );
            }
        } finally
        {
            setStrPending(null);
        }
    } /* end _change */

    const blnDisabled =
        blnLoading ||
        strPending !== null ||
        !objDirectory.browserSupported ||
        objDirectory.authorizedPrograms.length === 0;
    const strButtonClass =
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50';

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-blue-100 bg-[#f3f8fe] p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Current destination
                    </span>
                    <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-semibold text-[#073b82]">
                        Authorized:{' '}
                        {objDirectory.authorizedPrograms.join(' & ') || 'No assigned program'}
                    </span>
                </div>
                <div className="flex items-start gap-3">
                    <FolderOpen className="mt-0.5 size-5 shrink-0 text-[#0f53b7]" />
                    <p className="break-all text-sm font-semibold leading-6 text-slate-800">
                        {objDirectory.activePath}
                    </p>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                    {objDirectory.mode === 'custom' ? 'Custom destination' : 'Default destination'}{' '}
                    · Applies to documents, reports, exports, and attachments.
                </p>
            </div>

            {!objDirectory.browserSupported ? (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    This browser uses its standard download destination. Use a browser with folder
                    access, such as desktop Chrome or Edge, to enable GIA / SETUP folders.
                </p>
            ) : objDirectory.configured && objDirectory.permission !== 'granted' && !blnLoading ? (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    Folder access needs confirmation. Your browser may ask for permission on your
                    next download. If access is unavailable, the file goes to browser downloads.
                </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <button
                    className={`${strButtonClass} bg-[#0f53b7] text-white hover:bg-[#073b82]`}
                    disabled={blnDisabled}
                    onClick={() =>
                        void _change('browse', () =>
                            objDirectory.configured
                                ? chooseCustomDownloadDirectory(objUser)
                                : chooseDefaultDownloadRoot(objUser),
                        )
                    }
                    type="button"
                >
                    {strPending === 'browse' ? (
                        <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                        <FolderOpen className="size-4" />
                    )}
                    Browse / Change folder
                </button>
                <button
                    className={`${strButtonClass} border border-slate-200 text-slate-700 hover:bg-slate-50`}
                    disabled={blnDisabled}
                    onClick={() => void _change('reset', () => resetDownloadDirectory(objUser))}
                    type="button"
                >
                    {strPending === 'reset' ? (
                        <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                        <RotateCcw className="size-4" />
                    )}
                    Reset to default
                </button>
            </div>

            <form
                className="space-y-2 border-t border-slate-100 pt-5"
                onSubmit={(objEvent) =>
                {
                    objEvent.preventDefault();
                    if (!blnDisabled)
                    {
                        void _change('save', () => saveDownloadSubpath(objUser, strPath));
                    }
                }}
            >
                <label
                    className="block text-sm font-semibold text-slate-800"
                    htmlFor="export-subfolder"
                >
                    Subfolder path <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="flex gap-2">
                    <input
                        aria-describedby="export-path-help"
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                        disabled={blnDisabled || !objDirectory.configured}
                        id="export-subfolder"
                        onChange={(objEvent) => setStrPath(objEvent.target.value)}
                        placeholder="Reports/2026"
                        value={strPath}
                    />
                    <button
                        className={`${strButtonClass} border border-slate-200 text-[#073b82] hover:bg-blue-50`}
                        disabled={blnDisabled || !objDirectory.configured}
                        type="submit"
                    >
                        {strPending === 'save' ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : null}
                        Save
                    </button>
                </div>
                <p className="text-xs leading-5 text-slate-500" id="export-path-help">
                    Choose a parent folder first, then type a path inside it. Files go into its
                    authorized GIA / SETUP subfolders. To use another drive or an absolute path,
                    select it through Browse.
                </p>
            </form>

            <div aria-live="polite">
                {blnLoading ? (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                        <LoaderCircle className="size-4 animate-spin" />
                        Checking saved folder…
                    </p>
                ) : null}
                {strNotice ? (
                    <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        {strNotice}
                    </p>
                ) : null}
                {strError ? (
                    <p
                        className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
                        role="alert"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {strError}
                    </p>
                ) : null}
            </div>
            <p className="text-xs leading-5 text-slate-500">
                Your first chosen folder is the default for this account in this browser. Reset
                restores it. Canceling a folder picker during a download sends the file to browser
                downloads. Browsers show folder names here, rather than the full device path.
            </p>
        </div>
    ); // end return
} /* end ExportDirectorySettings */

/** Render account export directory and its available actions. */
export function AccountExportDirectory({ objUser }: { objUser: MockUser; })
{
    const [blnOpen, setBlnOpen] = useState(false);
    const _close = useCallback(() => setBlnOpen(false), []);
    return (
        <>
            <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#073b82]"
                onClick={() => setBlnOpen(true)}
                type="button"
            >
                <FolderCog className="size-4 shrink-0 text-[#0f53b7]" />
                Export directory
            </button>
            {blnOpen
                ? createPortal(
                    <ModalShell
                        txtDescription="Choose where your DPRMS files are saved."
                        onClose={_close}
                        title="Report Export Directory"
                        strWidth="md"
                    >
                        <ExportDirectorySettings
                            key={`${objUser.id ?? objUser.email}:${objUser.role}:${objUser.program ?? ''}`}
                            objUser={objUser}
                        />
                    </ModalShell>,
                    document.body,
                )
                : null}
        </>
    );
}

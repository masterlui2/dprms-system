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
    Folder,
    Info,
    Settings,
    LoaderCircle,
    RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MockUser } from '../../lib/mock_auth';
import { ROLE_LABEL } from '../../config/permissions';
import { cn } from '../../utils/cn';
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
    const blnFormDisabled = blnDisabled || !objDirectory.configured;

    return (
        <div className="space-y-4 font-sans">
            <section className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
                <div className="flex items-center gap-3.5">
                    <div className="grid size-11 place-items-center rounded-full bg-[#0f53b7] text-sm font-bold text-white shadow-xs shrink-0">
                        {objUser.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-slate-900">
                            {objUser.name}
                        </h4>
                        <p className="truncate text-xs text-slate-500">{objUser.email}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-8 border-t border-slate-200/80 pt-2.5 text-xs">
                    <div>
                        <span className="block text-[11px] font-medium text-slate-400">Role</span>
                        <span className="font-semibold text-slate-700">
                            {ROLE_LABEL[objUser.role] ?? objUser.role}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[11px] font-medium text-slate-400">
                            Program
                        </span>
                        <span className="font-semibold text-slate-700">
                            {objUser.program || 'All Programs'}
                        </span>
                    </div>
                    {objUser.applicationReference ? (
                        <div>
                            <span className="block text-[11px] font-medium text-slate-400">
                                Application Reference
                            </span>
                            <span className="font-mono font-semibold text-slate-700">
                                {objUser.applicationReference}
                            </span>
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <form
                    className="space-y-4"
                    onSubmit={(objEvent) =>
                    {
                        objEvent.preventDefault();
                        if (!blnFormDisabled)
                        {
                            void _change('save', () => saveDownloadSubpath(objUser, strPath));
                        }
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Folder className="size-4 text-[#0f53b7]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Downloads
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            className="block text-xs font-semibold text-slate-700"
                            htmlFor="downloads-location"
                        >
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
                                    value={objDirectory.activePath}
                                />
                            </div>
                            <button
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
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
                                    <LoaderCircle className="size-4 animate-spin text-[#0f53b7]" />
                                ) : (
                                    'Choose...'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            className="block text-xs font-semibold text-slate-700"
                            htmlFor="subfolder-path"
                        >
                            Subfolder <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input
                            className={cn(
                                'h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-800 outline-none',
                                'placeholder:font-sans placeholder:text-slate-400',
                                'focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50',
                            )}
                            disabled={blnFormDisabled}
                            id="subfolder-path"
                            onChange={(objEvent) => setStrPath(objEvent.target.value)}
                            placeholder="e.g. Reports/2026"
                            type="text"
                            value={strPath}
                        />
                    </div>

                    {!objDirectory.browserSupported ? (
                        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                            <Info className="mt-0.5 size-4 shrink-0 text-slate-500" />
                            <span>
                                Default folder active. To select a custom folder, enable File System
                                Access in Brave (
                                <code className="text-[11px]">
                                    brave://flags/#file-system-access-api
                                </code>
                                ) or use Chrome/Edge.
                            </span>
                        </div>
                    ) : null}

                    {strNotice ? (
                        <div
                            role="status"
                            className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-800"
                        >
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>{strNotice}</span>
                        </div>
                    ) : null}

                    {strError ? (
                        <div
                            className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-800"
                            role="alert"
                        >
                            <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                            <span>{strError}</span>
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        {objDirectory.configured ? (
                            <button
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800 disabled:opacity-50"
                                disabled={blnDisabled}
                                onClick={() =>
                                    void _change('reset', () => resetDownloadDirectory(objUser))
                                }
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
                            disabled={blnFormDisabled}
                            type="submit"
                        >
                            {strPending === 'save' ? (
                                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                            ) : null}
                            <span>Save Settings</span>
                        </button>
                    </div>
                </form>
            </section>
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
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#073b82]"
                onClick={() => setBlnOpen(true)}
                type="button"
            >
                <Settings className="size-4 shrink-0 text-slate-500" />
                <span>Settings</span>
            </button>
            {blnOpen
                ? createPortal(
                    <ModalShell
                        txtDescription="Manage account profile and download preferences."
                        onClose={_close}
                        title="Settings"
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

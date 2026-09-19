/**
 * System: DPRMS
 * Purpose: Render repayment ledger page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { AlertTriangle, LoaderCircle, ReceiptText } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { RepaymentLedgerView } from '../../components/admin/RepaymentLedgerView';
import
{
    fetchMySetupRepaymentProjects,
    repaymentErrorMessage,
    type SetupRepaymentProject,
} from '../../services/repayment_ledger_store';

/** Render repayment ledger page and its available actions. */
export function RepaymentLedgerPage()
{
    const [arrProjects, setArrProjects] = useState<SetupRepaymentProject[]>([]);
    const [intSelectedProjectId, setIntSelectedProjectId] = useState<number | null>(null);
    const [blnIsLoading, setBlnIsLoading] = useState(true);
    const [strError, setStrError] = useState<string | null>(null);

    useEffect(
        () =>
        {
            let blnActive = true;

            fetchMySetupRepaymentProjects()
                .then((arrRecords) =>
                {
                    if (!blnActive)
                    {
                        return;
                    }
                    setArrProjects(arrRecords);
                    setIntSelectedProjectId(arrRecords[0]?.id ?? null);
                })
                .catch((objLoadError) =>
                {
                    if (blnActive)
                    {
                        setStrError(repaymentErrorMessage(objLoadError));
                    }
                })
                .finally(() =>
                {
                    if (blnActive)
                    {
                        setBlnIsLoading(false);
                    }
                });

            return () =>
            {
                blnActive = false;
            };
        } /* end RepaymentLedgerPage */,
        [],
    );

    if (blnIsLoading)
    {
        return (
            <div className="grid min-h-[55vh] place-items-center">
                <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
            </div>
        );
    }

    if (strError)
    {
        return (
            <div className="space-y-6">
                <AdminPageHeader txtDescription="" strEyebrow="SETUP" title="Repayment Ledger" />
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
                    <AlertTriangle className="mx-auto size-7 text-rose-600" />
                    <p className="mt-3 font-bold text-rose-900">Could not load your ledger</p>
                    <p className="mt-1 text-sm text-rose-700">{strError}</p>
                </div>
            </div>
        );
    }

    if (!intSelectedProjectId)
    {
        return (
            <div className="space-y-6">
                <AdminPageHeader txtDescription="" strEyebrow="SETUP" title="Repayment Ledger" />
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                    <ReceiptText className="mx-auto size-8 text-slate-300" />
                    <p className="mt-3 font-bold text-slate-800">No active repayment project</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Your schedule will appear after project activation.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {arrProjects.length > 1 ? (
                <label className="ml-auto block max-w-md text-sm font-bold text-slate-700">
                    Project
                    <select
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                        onChange={(objEvent) =>
                            setIntSelectedProjectId(Number(objEvent.target.value))
                        }
                        value={intSelectedProjectId}
                    >
                        {arrProjects.map((objProject) => (
                            <option key={objProject.id} value={objProject.id}>
                                {objProject.referenceNumber} — {objProject.title}
                            </option>
                        ))}
                    </select>
                </label>
            ) : null}

            <RepaymentLedgerView key={intSelectedProjectId} intProjectId={intSelectedProjectId} />
        </div>
    );
} /* end RepaymentLedgerPage */

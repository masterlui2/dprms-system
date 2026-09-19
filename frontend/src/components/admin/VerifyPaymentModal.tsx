/**
 * System: DPRMS
 * Purpose: Render verify payment modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    FileDown,
    FileText,
    LoaderCircle,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportError } from '../../utils/error_reporting';

import { getMockUser } from '../../lib/mock_auth';
import { downloadBlob } from '../../services/download_manager';
import
{
    fetchSetupRepaymentProof,
    repaymentErrorMessage,
    verifySetupRepaymentPayment,
    type PaymentReviewStatus,
    type RepaymentInstallment,
    type RepaymentTransaction,
    type SetupRepaymentLedger,
} from '../../services/repayment_ledger_store';
import { cn } from '../../utils/cn';
import { ModalShell } from './ModalShell';

/** Format currency. */
function _formatCurrency(intValue: number): string
{
    return new Intl.NumberFormat('en-PH', {
        currency: 'PHP',
        maximumFractionDigits: 2,
        style: 'currency',
    }).format(intValue);
}

/** Format date. */
function _formatDate(strValue: string | null): string
{
    if (!strValue)
    {
        return 'Not recorded';
    }
    const dtDate = new Date(`${strValue.slice(0, 10)}T00:00:00`);
    return Number.isNaN(dtDate.getTime())
        ? strValue
        : dtDate.toLocaleDateString('en-PH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
}

/** Review label. */
function _reviewLabel(strStatus: PaymentReviewStatus): string
{
    if (strStatus === 'verified')
    {
        return 'Verified';
    }
    if (strStatus === 'rejected')
    {
        return 'Rejected';
    }
    return 'For review';
}

/** Render verify payment modal and its available actions. */
export function VerifyPaymentModal({
    blnCanVerify,
    objInstallment,
    onClose,
    onReviewed,
    intProjectId,
    objTransaction,
}: {
    blnCanVerify: boolean;
    objInstallment: RepaymentInstallment;
    onClose: () => void;
    onReviewed: (objLedger: SetupRepaymentLedger, strDecision: 'verified' | 'rejected') => void;
    intProjectId: number;
    objTransaction: RepaymentTransaction;
})
{
    const [txtRemarks, setTxtRemarks] = useState(objTransaction.remarks ?? '');
    const [strError, setStrError] = useState<string | null>(null);
    const [strProofError, setStrProofError] = useState<string | null>(null);
    const [strProofUrl, setStrProofUrl] = useState<string | null>(null);
    const [objProofBlob, setObjProofBlob] = useState<Blob | null>(null);
    const [blnIsDownloading, setBlnIsDownloading] = useState(false);
    const [strDownloadNotice, setStrDownloadNotice] = useState<string | null>(null);
    const [strDownloadError, setStrDownloadError] = useState<string | null>(null);
    const [blnIsProofLoading, setBlnIsProofLoading] = useState(objTransaction.hasProof);
    const [strPendingDecision, setStrPendingDecision] = useState<'verified' | 'rejected' | null>(
        null,
    );
    const blnCanDecide = blnCanVerify && objTransaction.status === 'pending';
    const blnIsPdf = objTransaction.proofMimeType === 'application/pdf';

    useEffect(
        () =>
        {
            setObjProofBlob(null);
            setStrProofUrl(null);
            setStrProofError(null);
            setStrDownloadNotice(null);
            setStrDownloadError(null);
            setBlnIsProofLoading(objTransaction.hasProof);
            if (!objTransaction.hasProof)
            {
                return;
            }

            let blnActive = true;
            let strObjectUrl: string | null = null;

            fetchSetupRepaymentProof(intProjectId, objInstallment.id, objTransaction.id)
                .then((objProof) =>
                {
                    if (!blnActive)
                    {
                        return;
                    }
                    strObjectUrl = URL.createObjectURL(objProof);
                    setObjProofBlob(objProof);
                    setStrProofUrl(strObjectUrl);
                })
                .catch((objProofLoadError) =>
                {
                    if (blnActive)
                    {
                        setStrProofError(repaymentErrorMessage(objProofLoadError));
                    }
                })
                .finally(() =>
                {
                    if (blnActive)
                    {
                        setBlnIsProofLoading(false);
                    }
                });

            return () =>
            {
                blnActive = false;
                if (strObjectUrl)
                {
                    URL.revokeObjectURL(strObjectUrl);
                }
            };
        } /* end VerifyPaymentModal */,
        [objInstallment.id, intProjectId, objTransaction.hasProof, objTransaction.id],
    );

    /** Handle download receipt. */
    async function _handleDownloadReceipt()
    {
        const objUser = getMockUser();
        if (!objUser || !objProofBlob || blnIsDownloading)
        {
            return;
        }
        setBlnIsDownloading(true);
        setStrDownloadNotice(null);
        setStrDownloadError(null);
        try
        {
            const strExtension =
                (
                    {
                        'application/pdf': 'pdf',
                        'image/png': 'png',
                        'image/jpeg': 'jpg',
                        'image/webp': 'webp',
                    } as Record<string, string>
                )[objTransaction.proofMimeType ?? objProofBlob.type] ?? 'bin';
            const objResult = await downloadBlob({
                blob: objProofBlob,
                fileName:
                    objTransaction.proofName ||
                    `SETUP_receipt_${intProjectId}_${objTransaction.id}.${strExtension}`,
                program: 'SETUP',
                user: objUser,
            });
            setStrDownloadNotice(
                objResult.usedBrowserFallback
                    ? 'Receipt sent to browser downloads.'
                    : `Receipt saved to ${objResult.destination}`,
            );
        } catch (errError)
        {
            reportError(errError, 'VerifyPaymentModal: handle download receipt failed.');

            setStrDownloadError(
                errError instanceof Error
                    ? errError.message
                    : 'The receipt could not be downloaded.',
            );
        } finally
        {
            setBlnIsDownloading(false);
        }
    }

    /** Handle decision. */
    async function _handleDecision(strDecision: 'verified' | 'rejected')
    {
        if (strDecision === 'rejected' && !txtRemarks.trim())
        {
            setStrError('Add a short reason before rejecting this payment.');
            return;
        }

        setStrError(null);
        setStrPendingDecision(strDecision);
        try
        {
            const objLedger = await verifySetupRepaymentPayment(
                intProjectId,
                objInstallment.id,
                objTransaction.id,
                { decision: strDecision, remarks: txtRemarks },
            );
            onReviewed(objLedger, strDecision);
        } catch (errReviewError)
        {
            reportError(errReviewError, 'VerifyPaymentModal: handle decision failed.');

            setStrError(repaymentErrorMessage(errReviewError));
            setStrPendingDecision(null);
        }
    } /* end _handleDecision */

    return (
        <ModalShell
            txtDescription={`${objInstallment.period} · Due ${_formatDate(objInstallment.dueDate)}`}
            objFooter={
                blnCanDecide ? (
                    <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                        <button
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            disabled={strPendingDecision !== null}
                            onClick={() => void _handleDecision('rejected')}
                            type="button"
                        >
                            {strPendingDecision === 'rejected' ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <XCircle className="size-4" />
                            )}
                            Reject
                        </button>
                        <button
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            disabled={strPendingDecision !== null}
                            onClick={() => void _handleDecision('verified')}
                            type="button"
                        >
                            {strPendingDecision === 'verified' ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                            Verify payment
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <button
                            className="h-10 rounded-xl px-5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                            onClick={onClose}
                            type="button"
                        >
                            Close
                        </button>
                    </div>
                )
            }
            onClose={onClose}
            title="Payment Review"
            strWidth="lg"
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
                <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="font-black text-slate-900">Official receipt</h3>
                        {strProofUrl ? (
                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <button
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-bold text-[#0f53b7] hover:bg-blue-100 disabled:opacity-50"
                                    disabled={blnIsDownloading || !objProofBlob}
                                    onClick={() => void _handleDownloadReceipt()}
                                    type="button"
                                >
                                    {blnIsDownloading ? (
                                        <LoaderCircle className="size-3.5 animate-spin" />
                                    ) : (
                                        <FileDown className="size-3.5" />
                                    )}{' '}
                                    {blnIsDownloading ? 'Downloading…' : 'Download Receipt'}
                                </button>
                                <a
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0f53b7] hover:underline"
                                    href={strProofUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    Open <ExternalLink className="size-3.5" />
                                </a>
                            </div>
                        ) : null}
                    </div>
                    {strDownloadNotice ? (
                        <p
                            className="mb-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800"
                            role="status"
                        >
                            {strDownloadNotice}
                        </p>
                    ) : null}
                    {strDownloadError ? (
                        <p
                            className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800"
                            role="alert"
                        >
                            {strDownloadError}
                        </p>
                    ) : null}
                    <div className="grid min-h-72 place-items-center overflow-hidden rounded-xl bg-slate-100">
                        {blnIsProofLoading ? (
                            <LoaderCircle className="size-7 animate-spin text-[#0f53b7]" />
                        ) : strProofUrl && blnIsPdf ? (
                            <iframe
                                className="h-[420px] w-full bg-white"
                                src={strProofUrl}
                                title="Official receipt"
                            />
                        ) : strProofUrl ? (
                            <img
                                alt="Official receipt"
                                className="max-h-[520px] w-full object-contain"
                                src={strProofUrl}
                            />
                        ) : (
                            <div className="px-5 text-center text-sm text-slate-500">
                                <FileText className="mx-auto mb-2 size-7" />
                                {strProofError ?? 'No receipt file attached.'}
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Amount submitted
                            </p>
                            <p className="numeric-value mt-1 text-2xl font-semibold text-[#073b82]">
                                {_formatCurrency(objTransaction.amountPaid)}
                            </p>
                        </div>
                        <span
                            className={cn(
                                'text-[11px] font-semibold',
                                objTransaction.status === 'pending' && 'text-amber-700',
                                objTransaction.status === 'verified' && 'text-emerald-700',
                                objTransaction.status === 'rejected' && 'text-rose-700',
                            )}
                        >
                            {_reviewLabel(objTransaction.status)}
                        </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div className="col-span-2">
                            <dt className="text-xs text-slate-500">OR number</dt>
                            <dd className="mt-0.5 font-bold text-slate-900">
                                {objTransaction.orNumber}
                            </dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-xs text-slate-500">Bank branch</dt>
                            <dd className="mt-0.5 font-semibold text-slate-800">
                                {objTransaction.bankBranch}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Check number</dt>
                            <dd className="mt-0.5 font-semibold text-slate-800">
                                {objTransaction.checkNumber}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Check date</dt>
                            <dd className="mt-0.5 font-semibold text-slate-800">
                                {_formatDate(objTransaction.checkDate)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Payment date</dt>
                            <dd className="mt-0.5 font-semibold text-slate-800">
                                {_formatDate(objTransaction.paymentDate)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Submitted by</dt>
                            <dd className="mt-0.5 font-semibold text-slate-800">
                                {objTransaction.recordedBy}
                            </dd>
                        </div>
                    </dl>

                    {blnCanDecide ? (
                        <label className="block text-sm font-bold text-slate-800">
                            Remarks{' '}
                            <span className="font-normal text-slate-400">(required to reject)</span>
                            <textarea
                                className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 font-normal outline-none placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                                maxLength={1000}
                                onChange={(objEvent) => setTxtRemarks(objEvent.target.value)}
                                placeholder="Short review note"
                                value={txtRemarks}
                            />
                        </label>
                    ) : objTransaction.remarks ? (
                        <div className="border-t border-slate-200 pt-3 text-sm text-slate-600">
                            <p className="text-xs font-bold text-slate-500">Review note</p>
                            <p className="mt-1">{objTransaction.remarks}</p>
                        </div>
                    ) : null}

                    {strError ? (
                        <div
                            className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800"
                            role="alert"
                        >
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            {strError}
                        </div>
                    ) : null}
                </section>
            </div>
        </ModalShell>
    ); // end return
} /* end VerifyPaymentModal */

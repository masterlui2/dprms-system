/**
 * System: DPRMS
 * Purpose: Render repayment ledger view for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Eye,
    LoaderCircle,
    LockKeyhole,
    PencilLine,
    ReceiptText,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { reportError } from '../../utils/error_reporting';

import
{
    fetchSetupRepaymentLedger,
    repaymentErrorMessage,
    type RepaymentInstallment,
    type RepaymentTransaction,
    type SetupRepaymentLedger,
} from '../../services/repayment_ledger_store';
import { cn } from '../../utils/cn';
import { AdminPanel } from './AdminPanel';
import { DataTable, type DataColumn } from './DataTable';
import { LogPaymentModal } from './LogPaymentModal';
import { MetricCard } from './MetricCard';
import { RepaymentScheduleBuilder } from './RepaymentScheduleBuilder';
import { VerifyPaymentModal } from './VerifyPaymentModal';

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
        return '—';
    }
    const dtDate = new Date(`${strValue.slice(0, 10)}T00:00:00`);
    return Number.isNaN(dtDate.getTime())
        ? strValue
        : dtDate.toLocaleDateString('en-PH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
}

/** Format month year. */
function _formatMonthYear(strValue: string): string
{
    const dtDate = new Date(`${strValue.slice(0, 10)}T00:00:00`);
    return Number.isNaN(dtDate.getTime())
        ? strValue
        : dtDate.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }).replace(' ', '-');
}

/** Status label. */
function _statusLabel(
    objInstallment: RepaymentInstallment,
    objTransaction?: RepaymentTransaction,
): string
{
    if (objTransaction?.status === 'pending')
    {
        return 'For review';
    }
    if (objTransaction?.status === 'rejected')
    {
        return 'Rejected';
    }
    if (objInstallment.status === 'paid')
    {
        return 'Paid';
    }
    if (objInstallment.status === 'overdue')
    {
        return 'Overdue';
    }
    return 'Pending';
}

/** Render payment status and its available actions. */
function PaymentStatus({
    objInstallment,
    objTransaction,
}: {
    objInstallment: RepaymentInstallment;
    objTransaction?: RepaymentTransaction;
})
{
    const strLabel = _statusLabel(objInstallment, objTransaction);

    const blnIsPaymentPending = strLabel === 'Pending' || strLabel === 'For review';
    const blnIsPaymentAttentionRequired = strLabel === 'Overdue' || strLabel === 'Rejected';

    return (
        <span
            className={cn(
                'text-xs font-black',
                strLabel === 'Paid' && 'text-emerald-700',
                blnIsPaymentPending && 'text-amber-700',
                blnIsPaymentAttentionRequired && 'text-rose-700',
            )}
        >
            {strLabel}
        </span>
    );
}

/** Render repayment ledger view and its available actions. */
export function RepaymentLedgerView({
    onBack,
    intProjectId,
}: {
    onBack?: () => void;
    intProjectId: number;
})
{
    const [objLedger, setObjLedger] = useState<SetupRepaymentLedger | null>(null);
    const [objPaymentInstallment, setObjPaymentInstallment] = useState<RepaymentInstallment | null>(
        null,
    );
    const [objReviewSelection, setObjReviewSelection] = useState<{
        installment: RepaymentInstallment;
        transaction: RepaymentTransaction;
    } | null>(null);
    const [blnIsLoading, setBlnIsLoading] = useState(true);
    const [blnIsEditingSchedule, setBlnIsEditingSchedule] = useState(false);
    const [strError, setStrError] = useState<string | null>(null);

    const _loadLedger = useCallback(async () =>
    {
        setBlnIsLoading(true);
        setStrError(null);
        try
        {
            const objLoadedLedger = await fetchSetupRepaymentLedger(intProjectId);
            setObjLedger(objLoadedLedger);
            setBlnIsEditingSchedule(
                !objLoadedLedger.schedule.initialized &&
                objLoadedLedger.permissions.canManageSchedule,
            );
        } catch (errLoadError)
        {
            reportError(errLoadError, 'RepaymentLedgerView: load ledger failed.');

            setStrError(repaymentErrorMessage(errLoadError));
        } finally
        {
            setBlnIsLoading(false);
        }
    }, [intProjectId]);

    useEffect(() =>
    {
        void _loadLedger();
    }, [_loadLedger]);

    if (blnIsLoading)
    {
        return (
            <div className="grid min-h-[55vh] place-items-center">
                <div className="text-center">
                    <LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">Loading ledger…</p>
                </div>
            </div>
        );
    }

    if (strError || !objLedger)
    {
        return (
            <div className="space-y-5">
                {onBack ? (
                    <button
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#0f53b7] ring-1 ring-slate-200 hover:bg-blue-50"
                        onClick={onBack}
                        type="button"
                    >
                        <ArrowLeft className="size-4" /> Back to projects
                    </button>
                ) : null}
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
                    <AlertTriangle className="mx-auto size-6 text-rose-600" />
                    <p className="mt-3 font-bold text-rose-900">Could not load this ledger</p>
                    <p className="mt-1 text-sm text-rose-700">{strError}</p>
                    <button
                        className="mt-4 h-9 rounded-lg bg-white px-4 text-xs font-bold text-rose-700 ring-1 ring-rose-200"
                        onClick={() => void _loadLedger()}
                        type="button"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    } /* end if */

    /** Action for. */
    function _actionFor(objItem: RepaymentInstallment)
    {
        if (!objLedger)
        {
            return null;
        }
        const objPendingTransaction = objItem.transactions.find(
            (objTransaction) => objTransaction.status === 'pending',
        );
        const objLatestTransaction = objItem.transactions[0];

        if (objPendingTransaction)
        {
            return (
                <button
                    className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 hover:underline"
                    onClick={() =>
                        setObjReviewSelection({
                            installment: objItem,
                            transaction: objPendingTransaction,
                        })
                    }
                    type="button"
                >
                    <Eye className="size-3.5" />
                    {objLedger.permissions.canVerifyPayment ? 'Review' : 'View'}
                </button>
            );
        }

        if (objLedger.permissions.canRecordPayment && objItem.remainingAmount > 0)
        {
            return (
                <button
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-2.5 text-xs font-bold text-white hover:bg-[#0b3f8b]"
                    onClick={() => setObjPaymentInstallment(objItem)}
                    type="button"
                >
                    <ReceiptText className="size-3.5" />
                    {objLatestTransaction?.status === 'rejected' ? 'Resubmit' : 'Pay'}
                </button>
            );
        }

        return objLatestTransaction ? (
            <button
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
                onClick={() =>
                    setObjReviewSelection({
                        installment: objItem,
                        transaction: objLatestTransaction,
                    })
                }
                type="button"
            >
                <Eye className="size-3.5" /> View
            </button>
        ) : (
            <span className="text-slate-300">—</span>
        );
    } /* end _actionFor */

    const arrColumns: DataColumn<RepaymentInstallment>[] = [
        {
            className: 'w-[10%] !text-[11px]',
            header: 'Month-Year',
            id: 'monthYear',
            render: (objItem) => (
                <span className="font-black text-slate-900" title={objItem.period}>
                    {_formatMonthYear(objItem.dueDate)}
                </span>
            ),
            sortValue: (objItem) => objItem.dueDate,
        },
        {
            className: 'w-[11%] !text-[11px] text-right',
            header: 'Amount',
            id: 'scheduledAmount',
            render: (objItem) => (
                <span className="font-bold text-slate-700">{_formatCurrency(objItem.amount)}</span>
            ),
            sortValue: (objItem) => objItem.amount,
        },
        {
            className: 'w-[11%] !text-[11px] text-right',
            header: 'Amount Paid',
            id: 'amountPaid',
            render: (objItem) =>
            {
                const intVerifiedPaid = objItem.amountPaid;
                return intVerifiedPaid > 0 ? (
                    <span className="font-bold text-emerald-700">
                        {_formatCurrency(intVerifiedPaid)}
                    </span>
                ) : (
                    <span className="text-slate-300">—</span>
                );
            },
            sortValue: (objItem) => objItem.amountPaid,
        },
        {
            className: 'w-[15%] !text-[11px]',
            header: 'Bank / Branch',
            id: 'bank',
            render: (objItem) => (
                <span className="text-xs leading-4 text-slate-600">
                    {objItem.transactions[0]?.bankBranch ?? '—'}
                </span>
            ),
        },
        {
            className: 'w-[12%] !text-[11px]',
            header: 'Check No.',
            id: 'checkNumber',
            render: (objItem) => (
                <span className="text-xs font-semibold text-slate-700">
                    {objItem.transactions[0]?.checkNumber ?? '—'}
                </span>
            ),
        },
        {
            className: 'w-[15%] !text-[11px]',
            header: 'OR No.',
            id: 'orNumber',
            render: (objItem) =>
            {
                const objTransaction = objItem.transactions[0];
                return objTransaction ? (
                    <p className="truncate text-xs font-black text-slate-800">
                        {objTransaction.orNumber}
                    </p>
                ) : (
                    <span className="text-slate-300">—</span>
                );
            },
        },
        {
            className: 'w-[12%] !text-[11px]',
            header: 'OR Date',
            id: 'orDate',
            render: (objItem) => (
                <span className="text-xs text-slate-600">
                    {_formatDate(objItem.transactions[0]?.paymentDate ?? null)}
                </span>
            ),
        },
        {
            className: 'w-[10%] !text-[11px]',
            header: 'Status',
            id: 'status',
            render: (objItem) => (
                <PaymentStatus objInstallment={objItem} objTransaction={objItem.transactions[0]} />
            ),
            sortValue: (objItem) => _statusLabel(objItem, objItem.transactions[0]),
        },
        {
            className: 'w-[10%] !text-[11px] text-right',
            header: 'Action',
            id: 'action',
            render: _actionFor,
        },
    ];

    /** Handle payment submitted. */
    function _handlePaymentSubmitted(objUpdated: SetupRepaymentLedger)
    {
        setObjLedger(objUpdated);
        setObjPaymentInstallment(null);
        void Swal.fire({
            icon: 'success',
            position: 'top-end',
            showConfirmButton: false,
            text: 'Ready for focal review.',
            timer: 2500,
            title: 'Payment submitted',
            toast: true,
        });
    }

    /** Handle payment reviewed. */
    function _handlePaymentReviewed(
        objUpdated: SetupRepaymentLedger,
        strDecision: 'verified' | 'rejected',
    )
    {
        setObjLedger(objUpdated);
        setObjReviewSelection(null);
        void Swal.fire({
            icon: strDecision === 'verified' ? 'success' : 'info',
            position: 'top-end',
            showConfirmButton: false,
            timer: 2500,
            title: strDecision === 'verified' ? 'Payment verified' : 'Payment rejected',
            toast: true,
        });
    }

    /** Handle schedule saved. */
    function _handleScheduleSaved(objUpdated: SetupRepaymentLedger)
    {
        setObjLedger(objUpdated);
        setBlnIsEditingSchedule(false);
        void Swal.fire({
            icon: 'success',
            position: 'top-end',
            showConfirmButton: false,
            text: 'The funding terms and installment rows are now live.',
            timer: 2800,
            title: 'Repayment schedule saved',
            toast: true,
        });
    }

    const blnShowLedgerActions = Boolean(
        onBack ||
        objLedger.permissions.readOnly ||
        objLedger.permissions.canManageSchedule ||
        objLedger.schedule.locked,
    );

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 font-sans">
                <div className="flex items-start gap-3">
                    <span className="mt-1 h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7] shrink-0" />
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
                            <span>Repayment Monitoring</span>
                            <span>&gt;</span>
                            <span className="font-mono font-bold text-[#285497]">
                                {objLedger.project.referenceNumber}
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                            {objLedger.project.title}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                            <span className="font-bold text-slate-800">
                                {objLedger.project.cooperator}
                            </span>
                            <span className="mx-2 text-slate-300">·</span>
                            {objLedger.project.location}
                        </p>
                    </div>
                </div>

                {blnShowLedgerActions ? (
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                        {onBack ? (
                            <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-[#0f53b7] transition"
                                onClick={onBack}
                                type="button"
                            >
                                <ArrowLeft className="size-3.5" /> Back to projects
                            </button>
                        ) : null}
                        {objLedger.permissions.readOnly ? (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600">
                                Read only
                            </span>
                        ) : null}
                        {objLedger.schedule.locked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                                <LockKeyhole className="size-3" /> Schedule locked
                            </span>
                        ) : null}
                        {objLedger.permissions.canManageSchedule && !blnIsEditingSchedule ? (
                            <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#0b3f8b] transition"
                                onClick={() => setBlnIsEditingSchedule(true)}
                                type="button"
                            >
                                <PencilLine className="size-3.5" />
                                {objLedger.schedule.initialized
                                    ? 'Edit schedule'
                                    : 'Initialize ledger'}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {objLedger.schedule.initialized ? (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        strDetail="Approved amount"
                        icon={Wallet}
                        strLabel="Total Project Cost"
                        value={_formatCurrency(objLedger.summary.totalProjectCost)}
                    />
                    <MetricCard
                        strDetail="Verified payments"
                        icon={CheckCircle2}
                        strLabel="Amount Refunded"
                        strTone="green"
                        value={_formatCurrency(objLedger.summary.amountPaid)}
                    />
                    <MetricCard
                        strDetail="Unpaid scheduled amount"
                        icon={Clock3}
                        strLabel="Remaining Balance"
                        strTone="sky"
                        value={_formatCurrency(objLedger.summary.outstandingBalance)}
                    />
                    <MetricCard
                        strDetail={
                            objLedger.summary.overdueInstallments
                                ? 'Needs follow-up'
                                : 'Payments are on track'
                        }
                        icon={objLedger.summary.overdueInstallments ? AlertTriangle : CheckCircle2}
                        strLabel="Overdue Count"
                        strTone={objLedger.summary.overdueInstallments ? 'red' : 'green'}
                        value={String(objLedger.summary.overdueInstallments)}
                    />
                </section>
            ) : null}

            {blnIsEditingSchedule ? (
                <RepaymentScheduleBuilder
                    objLedger={objLedger}
                    onCancel={() => setBlnIsEditingSchedule(false)}
                    onSaved={_handleScheduleSaved}
                />
            ) : !objLedger.schedule.initialized ? (
                <AdminPanel
                    txtDescription="Financial details and repayment activity will appear after initialization."
                    title="Repayment Schedule Required"
                >
                    <div className="px-6 py-12 text-center sm:px-10">
                        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[#0f53b7]">
                            <Clock3 className="size-7" />
                        </span>
                        <p className="mt-4 font-black text-slate-900">
                            {objLedger.permissions.canManageSchedule
                                ? 'Initialize this project’s repayment ledger'
                                : 'Waiting for the SSCP Focal'}
                        </p>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            {objLedger.permissions.canManageSchedule
                                ? 'Enter the approved funding, release date, amortization start, and repayment term before financial records can be displayed.'
                                : 'The funding summary, installment schedule, and payment controls will become available after the SSCP Focal saves the project’s repayment schedule.'}
                        </p>
                        {objLedger.permissions.canManageSchedule ? (
                            <button
                                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b]"
                                onClick={() => setBlnIsEditingSchedule(true)}
                                type="button"
                            >
                                <PencilLine className="size-4" /> Initialize ledger
                            </button>
                        ) : null}
                    </div>
                </AdminPanel>
            ) : (
                <AdminPanel
                    txtDescription={`${objLedger.installments.length} installment${objLedger.installments.length === 1 ? '' : 's'} from the live ledger`}
                    title="Repayment Schedule"
                >
                    <DataTable
                        arrColumns={arrColumns}
                        arrData={objLedger.installments}
                        txtEmptyDescription="No repayment schedule is available for this project."
                        strEmptyTitle="No repayment schedule"
                        blnFitColumns
                        getRowKey={(objItem) => String(objItem.id)}
                        objGroupedHeader={
                            <tr className="border-b border-slate-200 text-center text-[11px] font-black uppercase tracking-wide">
                                <th
                                    className="border-r border-blue-200 bg-blue-50 px-3 py-2.5 text-[#073b82]"
                                    colSpan={2}
                                >
                                    Repayment Schedule
                                </th>
                                <th
                                    className="border-r border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900"
                                    colSpan={5}
                                >
                                    Actual Repayment
                                </th>
                                <th className="bg-slate-100 px-3 py-2.5 text-slate-600" colSpan={2}>
                                    Review
                                </th>
                            </tr>
                        }
                        intInitialRowsPerPage={6}
                        mobileRender={
                            (objItem) =>
                            {
                                const objTransaction = objItem.transactions[0];
                                return (
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-slate-900">
                                                    {_formatMonthYear(objItem.dueDate)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Due {_formatDate(objItem.dueDate)}
                                                </p>
                                            </div>
                                            <PaymentStatus
                                                objInstallment={objItem}
                                                objTransaction={objTransaction}
                                            />
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                                Amount
                                            </p>
                                            <p className="mt-1 text-sm font-black text-slate-800">
                                                {_formatCurrency(objItem.amount)}
                                            </p>
                                        </div>
                                        {objTransaction ? (
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                <p className="text-slate-500">
                                                    OR{' '}
                                                    <span className="font-bold text-slate-800">
                                                        {objTransaction.orNumber}
                                                    </span>
                                                </p>
                                                <p className="text-slate-500">
                                                    OR date{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {_formatDate(objTransaction.paymentDate)}
                                                    </span>
                                                </p>
                                                <p className="col-span-2 text-slate-500">
                                                    Bank{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {objTransaction.bankBranch}
                                                    </span>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">
                                                No payment submitted.
                                            </p>
                                        )}
                                        <div className="flex justify-end">
                                            {_actionFor(objItem)}
                                        </div>
                                    </div>
                                );
                            } /* end RepaymentLedgerView */
                        }
                        strSearchPlaceholder="Search month, OR, bank, or status…"
                        searchText={(objItem) =>
                        {
                            const objTransaction = objItem.transactions[0];
                            return `${objItem.period} ${objItem.dueDate} ${objItem.status} ${objTransaction?.orNumber ?? ''} ${objTransaction?.bankBranch ?? ''} ${objTransaction?.checkNumber ?? ''} ${objTransaction?.remarks ?? ''}`;
                        }}
                        strVariant="clean"
                    />
                </AdminPanel>
            )}

            {objPaymentInstallment ? (
                <LogPaymentModal
                    objInstallment={objPaymentInstallment}
                    onClose={() => setObjPaymentInstallment(null)}
                    onSubmitted={_handlePaymentSubmitted}
                    intProjectId={objLedger.project.id}
                />
            ) : null}
            {objReviewSelection ? (
                <VerifyPaymentModal
                    blnCanVerify={objLedger.permissions.canVerifyPayment}
                    objInstallment={objReviewSelection.installment}
                    onClose={() => setObjReviewSelection(null)}
                    onReviewed={_handlePaymentReviewed}
                    intProjectId={objLedger.project.id}
                    objTransaction={objReviewSelection.transaction}
                />
            ) : null}
        </div>
    ); // end return
} /* end RepaymentLedgerView */

/**
 * System: DPRMS
 * Purpose: Render repayment schedule builder for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CalendarDays, Plus, RefreshCw, Save, Trash2, Wallet } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { reportError } from '../../utils/error_reporting';

import
{
    repaymentErrorMessage,
    saveSetupRepaymentSchedule,
    type SetupRepaymentLedger,
} from '../../services/repayment_ledger_store';
import { cn } from '../../utils/cn';
import { AdminPanel } from './AdminPanel';

interface DraftInstallment
{
    amount: string;
    dueDate: string;
    key: string;
    periodLabel: string;
}

interface Props
{
    objLedger: SetupRepaymentLedger;
    onCancel: () => void;
    onSaved: (objLedger: SetupRepaymentLedger) => void;
}

/** Amount to cents. */
function _amountToCents(strValue: string): number
{
    const curAmount = Number(strValue);
    return Number.isFinite(curAmount) ? Math.round(curAmount * 100) : 0;
}

/** Format currency from cents. */
function _formatCurrencyFromCents(intValue: number): string
{
    return new Intl.NumberFormat('en-PH', {
        currency: 'PHP',
        maximumFractionDigits: 2,
        style: 'currency',
    }).format(intValue / 100);
}

/** Add months to iso date. */
function _addMonthsToIsoDate(strValue: string, intOffset: number): string
{
    const [intYear, intMonth, intDay] = strValue.split('-').map(Number);
    const intMonthIndex = intMonth - 1 + intOffset;
    const intTargetYear = intYear + Math.floor(intMonthIndex / 12);
    const intTargetMonthIndex = ((intMonthIndex % 12) + 12) % 12;
    const intTargetDay = Math.min(
        intDay,
        new Date(intTargetYear, intTargetMonthIndex + 1, 0).getDate(),
    );

    return `${intTargetYear}-${String(intTargetMonthIndex + 1).padStart(2, '0')}-${String(intTargetDay).padStart(2, '0')}`;
}

/** Period label. */
function _periodLabel(strValue: string): string
{
    const dtDate = new Date(`${strValue}T00:00:00`);
    return Number.isNaN(dtDate.getTime())
        ? 'New installment'
        : dtDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

/** Next row key. */
function _nextRowKey(): string
{
    return `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Render repayment schedule builder and its available actions. */
export function RepaymentScheduleBuilder({ objLedger, onCancel, onSaved }: Props)
{
    const intInitialTerm =
        objLedger.schedule.repaymentTermMonths ?? (objLedger.installments.length || 12);
    const [strFundingAmount, setStrFundingAmount] = useState(
        objLedger.summary.totalProjectCost > 0 ? objLedger.summary.totalProjectCost.toFixed(2) : '',
    );
    const [strFullReleaseDate, setStrFullReleaseDate] = useState(
        objLedger.schedule.fullReleaseDate ?? '',
    );
    const [strAmortizationStartDate, setStrAmortizationStartDate] = useState(
        objLedger.schedule.amortizationStartDate ?? '',
    );
    const [strRepaymentTerm, setStrRepaymentTerm] = useState(String(intInitialTerm));
    const [arrRows, setArrRows] = useState<DraftInstallment[]>(
        objLedger.installments.map((objInstallment) => ({
            amount: objInstallment.amount.toFixed(2),
            dueDate: objInstallment.dueDate,
            key: `ledger-${objInstallment.id}`,
            periodLabel: objInstallment.period,
        })),
    );
    const [strError, setStrError] = useState<string | null>(null);
    const [blnIsSaving, setBlnIsSaving] = useState(false);

    const curFundingCents = _amountToCents(strFundingAmount);
    const intScheduledCents = useMemo(
        () => arrRows.reduce((intTotal, objRow) => intTotal + _amountToCents(objRow.amount), 0),
        [arrRows],
    );
    const intVarianceCents = curFundingCents - intScheduledCents;

    /** Generate schedule. */
    function _generateSchedule()
    {
        setStrError(null);
        const intTerm = Number(strRepaymentTerm);

        if (curFundingCents <= 0 || !strFullReleaseDate)
        {
            setStrError(
                'Enter the funding amount and full release date before generating the schedule.',
            );
            return;
        }
        if (!strAmortizationStartDate)
        {
            setStrError('Select the amortization start date.');
            return;
        }
        if (!Number.isInteger(intTerm) || intTerm < 1 || intTerm > 120)
        {
            setStrError('Repayment term must be between 1 and 120 months.');
            return;
        }
        if (strAmortizationStartDate < strFullReleaseDate)
        {
            setStrError('Amortization cannot start before the full release date.');
            return;
        }
        if (curFundingCents < intTerm)
        {
            setStrError('Funding must allow at least ₱0.01 for every installment.');
            return;
        }

        const intBaseCents = Math.floor(curFundingCents / intTerm);
        const intRemainderCents = curFundingCents - intBaseCents * intTerm;
        setArrRows(
            Array.from({ length: intTerm }, (_objUnused, intIndex) =>
            {
                const strDueDate = _addMonthsToIsoDate(strAmortizationStartDate, intIndex);
                const curAmountCents = intBaseCents + (intIndex < intRemainderCents ? 1 : 0);
                return {
                    amount: (curAmountCents / 100).toFixed(2),
                    dueDate: strDueDate,
                    key: _nextRowKey(),
                    periodLabel: _periodLabel(strDueDate),
                };
            }),
        );
    } /* end _generateSchedule */

    /** Distribute evenly. */
    function _distributeEvenly()
    {
        if (curFundingCents <= 0 || arrRows.length === 0 || curFundingCents < arrRows.length)
        {
            setStrError('Enter a valid funding amount before distributing installments.');
            return;
        }

        const intBaseCents = Math.floor(curFundingCents / arrRows.length);
        const intRemainderCents = curFundingCents - intBaseCents * arrRows.length;
        setArrRows((arrCurrent) =>
            arrCurrent.map((objRow, intIndex) => ({
                ...objRow,
                amount: ((intBaseCents + (intIndex < intRemainderCents ? 1 : 0)) / 100).toFixed(2),
            })),
        );
        setStrError(null);
    }

    /** Add installment. */
    function _addInstallment()
    {
        if (arrRows.length >= 120)
        {
            return;
        }
        const strPreviousDueDate = arrRows.at(-1)?.dueDate;
        const strDueDate = strPreviousDueDate
            ? _addMonthsToIsoDate(strPreviousDueDate, 1)
            : strAmortizationStartDate;
        const arrNextRows = [
            ...arrRows,
            {
                amount: '0.00',
                dueDate: strDueDate,
                key: _nextRowKey(),
                periodLabel: strDueDate
                    ? _periodLabel(strDueDate)
                    : `Installment ${arrRows.length + 1}`,
            },
        ];
        setArrRows(arrNextRows);
        setStrRepaymentTerm(String(arrNextRows.length));
        setStrError(null);
    }

    /** Remove installment. */
    function _removeInstallment(strKey: string)
    {
        const arrNextRows = arrRows.filter((objRow) => objRow.key !== strKey);
        setArrRows(arrNextRows);
        setStrRepaymentTerm(String(arrNextRows.length));
        setStrError(null);
    }

    /** Update installment. */
    function _updateInstallment(strKey: string, objChanges: Partial<DraftInstallment>)
    {
        setArrRows((arrCurrent) =>
            arrCurrent.map((objRow) =>
                objRow.key === strKey ? { ...objRow, ...objChanges } : objRow,
            ),
        );
        setStrError(null);
    }

    /** Validate schedule. */
    function _validateSchedule(): string | null
    {
        const intTerm = Number(strRepaymentTerm);
        if (curFundingCents <= 0 || !strFullReleaseDate || !strAmortizationStartDate)
        {
            return 'Complete all funding terms before saving.';
        }
        if (!Number.isInteger(intTerm) || intTerm !== arrRows.length || arrRows.length === 0)
        {
            return 'The installment count must match the repayment term.';
        }
        if (intScheduledCents !== curFundingCents)
        {
            return 'Installment amounts must exactly match the total project cost.';
        }
        if (
            arrRows.some(
                (objRow) =>
                    !objRow.periodLabel.trim() ||
                    !objRow.dueDate ||
                    _amountToCents(objRow.amount) <= 0,
            )
        )
        {
            return 'Every installment needs a period label, due date, and positive amount.';
        }
        const arrLabels = arrRows.map((objRow) => objRow.periodLabel.trim().toLowerCase());
        const arrDates = arrRows.map((objRow) => objRow.dueDate);
        if (
            new Set(arrLabels).size !== arrLabels.length ||
            new Set(arrDates).size !== arrDates.length
        )
        {
            return 'Period labels and due dates must be unique.';
        }
        if (arrDates.some((strDate) => strDate < strAmortizationStartDate))
        {
            return 'Installment dates cannot be earlier than the amortization start date.';
        }
        if (
            arrDates.some((strDate, intIndex) => intIndex > 0 && strDate < arrDates[intIndex - 1])
        )
        {
            return 'Installment dates must be in chronological order.';
        }
        return null;
    } /* end _validateSchedule */

    /** Handle save. */
    async function _handleSave(objEvent: FormEvent<HTMLFormElement>)
    {
        objEvent.preventDefault();
        const strValidationError = _validateSchedule();
        if (strValidationError)
        {
            setStrError(strValidationError);
            return;
        }

        setBlnIsSaving(true);
        setStrError(null);
        try
        {
            const objUpdated = await saveSetupRepaymentSchedule(objLedger.project.id, {
                amortizationStartDate: strAmortizationStartDate,
                fullReleaseDate: strFullReleaseDate,
                installments: arrRows.map((objRow) => ({
                    amount: _amountToCents(objRow.amount) / 100,
                    dueDate: objRow.dueDate,
                    periodLabel: objRow.periodLabel,
                })),
                repaymentTermMonths: Number(strRepaymentTerm),
                totalProjectCost: curFundingCents / 100,
            });
            onSaved(objUpdated);
        } catch (errSaveError)
        {
            reportError(errSaveError, 'RepaymentScheduleBuilder: handle save failed.');

            setStrError(repaymentErrorMessage(errSaveError));
        } finally
        {
            setBlnIsSaving(false);
        }
    } /* end _handleSave */

    return (
        <AdminPanel
            txtDescription="Set the funding terms, generate the monthly schedule, then adjust individual rows before saving."
            title={
                objLedger.schedule.initialized
                    ? 'Customize Repayment Schedule'
                    : 'Initialize Repayment Ledger'
            }
        >
            <form className="space-y-6 p-5 sm:p-6" onSubmit={_handleSave}>
                <section className="rounded-2xl border border-blue-100 bg-[#f7fbff] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#0f53b7]">
                        Selected active SETUP project
                    </p>
                    <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Project title</dt>
                            <dd className="mt-1 font-black text-slate-900">
                                {objLedger.project.title}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Reference number</dt>
                            <dd className="mt-1 font-black text-[#073b82]">
                                {objLedger.project.referenceNumber}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Cooperator</dt>
                            <dd className="mt-1 font-semibold text-slate-800">
                                {objLedger.project.cooperator}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-slate-400">Location</dt>
                            <dd className="mt-1 font-semibold text-slate-800">
                                {objLedger.project.location}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <Wallet className="size-4 text-[#0f53b7]" />
                        <h3 className="font-black text-slate-900">Funding and repayment terms</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="text-xs font-bold text-slate-600">
                            Total Approved Funding Amount <span className="text-rose-600">*</span>
                            <div className="relative mt-1.5">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">
                                    ₱
                                </span>
                                <input
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                                    min="0.01"
                                    onChange={(objEvent) =>
                                    {
                                        setStrFundingAmount(objEvent.target.value);
                                        setStrError(null);
                                    }}
                                    placeholder="0.00"
                                    required
                                    step="0.01"
                                    type="number"
                                    value={strFundingAmount}
                                />
                            </div>
                        </label>
                        <label className="text-xs font-bold text-slate-600">
                            Full Release Date <span className="text-rose-600">*</span>
                            <input
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                                onChange={(objEvent) =>
                                {
                                    setStrFullReleaseDate(objEvent.target.value);
                                    setStrError(null);
                                }}
                                required
                                type="date"
                                value={strFullReleaseDate}
                            />
                        </label>
                        <label className="text-xs font-bold text-slate-600">
                            Amortization Start Date <span className="text-rose-600">*</span>
                            <input
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                                min={strFullReleaseDate || undefined}
                                onChange={(objEvent) =>
                                {
                                    setStrAmortizationStartDate(objEvent.target.value);
                                    setStrError(null);
                                }}
                                required
                                type="date"
                                value={strAmortizationStartDate}
                            />
                        </label>
                        <label className="text-xs font-bold text-slate-600">
                            Repayment Term (months) <span className="text-rose-600">*</span>
                            <input
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                                max="120"
                                min="1"
                                onChange={(objEvent) =>
                                {
                                    setStrRepaymentTerm(objEvent.target.value);
                                    setStrError(null);
                                }}
                                required
                                type="number"
                                value={strRepaymentTerm}
                            />
                        </label>
                    </div>
                    <button
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={blnIsSaving}
                        onClick={_generateSchedule}
                        type="button"
                    >
                        <CalendarDays className="size-4" /> Generate monthly schedule
                    </button>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-black text-slate-900">Installment schedule</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Amounts, labels, and dates remain editable until payment activity
                                begins.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-blue-50"
                                onClick={_distributeEvenly}
                                type="button"
                            >
                                <RefreshCw className="size-3.5" /> Distribute equally
                            </button>
                            <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#0f53b7] hover:bg-blue-100"
                                onClick={_addInstallment}
                                type="button"
                            >
                                <Plus className="size-3.5" /> Add installment
                            </button>
                        </div>
                    </div>

                    {arrRows.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="border-b border-slate-200 bg-white text-[11px] font-black uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="w-16 px-4 py-3 text-right">No.</th>
                                        <th className="px-3 py-3">Period label</th>
                                        <th className="w-52 px-3 py-3">Due date</th>
                                        <th className="w-56 px-3 py-3 text-right">Amount</th>
                                        <th className="w-16 px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {arrRows.map((objRow, intIndex) => (
                                        <tr className="hover:bg-blue-50/30" key={objRow.key}>
                                            <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-slate-400">
                                                {intIndex + 1}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    aria-label={`Installment ${intIndex + 1} period label`}
                                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-800 outline-none focus:border-[#0f53b7]"
                                                    maxLength={100}
                                                    onChange={(objEvent) =>
                                                        _updateInstallment(objRow.key, {
                                                            periodLabel: objEvent.target.value,
                                                        })
                                                    }
                                                    required
                                                    type="text"
                                                    value={objRow.periodLabel}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    aria-label={`Installment ${intIndex + 1} due date`}
                                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-800 outline-none focus:border-[#0f53b7]"
                                                    min={strAmortizationStartDate || undefined}
                                                    onChange={(objEvent) =>
                                                        _updateInstallment(objRow.key, {
                                                            dueDate: objEvent.target.value,
                                                        })
                                                    }
                                                    required
                                                    type="date"
                                                    value={objRow.dueDate}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    aria-label={`Installment ${intIndex + 1} amount`}
                                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-right font-black text-slate-900 outline-none focus:border-[#0f53b7]"
                                                    min="0.01"
                                                    onChange={(objEvent) =>
                                                        _updateInstallment(objRow.key, {
                                                            amount: objEvent.target.value,
                                                        })
                                                    }
                                                    required
                                                    step="0.01"
                                                    type="number"
                                                    value={objRow.amount}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    aria-label={`Remove installment ${intIndex + 1}`}
                                                    className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                                                    disabled={arrRows.length <= 1}
                                                    onClick={() => _removeInstallment(objRow.key)}
                                                    type="button"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <CalendarDays className="mx-auto size-7 text-slate-300" />
                            <p className="mt-3 font-bold text-slate-700">
                                No installments generated
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Complete the funding terms, then generate the schedule.
                            </p>
                        </div>
                    )}

                    <div className="grid gap-3 border-t border-slate-200 bg-[#f8fbff] px-4 py-4 text-sm sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-medium text-slate-400">Project cost</p>
                            <p className="numeric-value mt-1 font-semibold text-[#073b82]">
                                {_formatCurrencyFromCents(curFundingCents)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-400">Scheduled total</p>
                            <p className="numeric-value mt-1 font-semibold text-slate-900">
                                {_formatCurrencyFromCents(intScheduledCents)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-400">Variance</p>
                            <p
                                className={cn(
                                    'numeric-value mt-1 font-semibold',
                                    intVarianceCents === 0 ? 'text-emerald-700' : 'text-rose-700',
                                )}
                            >
                                {_formatCurrencyFromCents(Math.abs(intVarianceCents))}
                                {intVarianceCents === 0
                                    ? ' · Balanced'
                                    : intVarianceCents > 0
                                        ? ' under'
                                        : ' over'}
                            </p>
                        </div>
                    </div>
                </section>

                {strError ? (
                    <div
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                        role="alert"
                    >
                        {strError}
                    </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                        className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        disabled={blnIsSaving}
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-black text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={blnIsSaving || arrRows.length === 0 || intVarianceCents !== 0}
                        type="submit"
                    >
                        {blnIsSaving ? (
                            <RefreshCw className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        {blnIsSaving ? 'Saving schedule…' : 'Save repayment schedule'}
                    </button>
                </div>
            </form>
        </AdminPanel>
    ); // end return
} /* end RepaymentScheduleBuilder */

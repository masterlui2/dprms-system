/**
 * System: DPRMS
 * Purpose: Render log payment modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { AlertTriangle, CheckCircle2, LoaderCircle, Send, Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { reportError } from '../../utils/error_reporting';

import
{
    repaymentErrorMessage,
    submitSetupRepaymentPayment,
    type RepaymentInstallment,
    type SetupRepaymentLedger,
} from '../../services/repayment_ledger_store';
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
function _formatDate(strValue: string): string
{
    const dtDate = new Date(`${strValue.slice(0, 10)}T00:00:00`);
    return Number.isNaN(dtDate.getTime())
        ? strValue
        : dtDate.toLocaleDateString('en-PH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
}

/** Local date. */
function _localDate(): string
{
    const dtNow = new Date();
    const intOffset = dtNow.getTimezoneOffset() * 60_000;
    return new Date(dtNow.getTime() - intOffset).toISOString().slice(0, 10);
}

const INPUT_CLASS_NAME =
    'mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100';

/** Render log payment modal and its available actions. */
export function LogPaymentModal({
    objInstallment,
    onClose,
    onSubmitted,
    intProjectId,
}: {
    objInstallment: RepaymentInstallment;
    onClose: () => void;
    onSubmitted: (objLedger: SetupRepaymentLedger) => void;
    intProjectId: number;
})
{
    const [strAmountPaid, setStrAmountPaid] = useState(objInstallment.remainingAmount.toFixed(2));
    const [strOrNumber, setStrOrNumber] = useState('');
    const [strBankBranch, setStrBankBranch] = useState('');
    const [strCheckNumber, setStrCheckNumber] = useState('');
    const [strCheckDate, setStrCheckDate] = useState(_localDate);
    const [strPaymentDate, setStrPaymentDate] = useState(_localDate);
    const [objPaymentProof, setObjPaymentProof] = useState<File | null>(null);
    const [strError, setStrError] = useState<string | null>(null);
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);

    /** Handle submit. */
    async function _handleSubmit(objEvent: FormEvent<HTMLFormElement>)
    {
        objEvent.preventDefault();
        setStrError(null);

        if (!objPaymentProof)
        {
            setStrError('Attach a photo or PDF of the official receipt.');
            return;
        }

        if (objPaymentProof.size > 5 * 1024 * 1024)
        {
            setStrError('The OR file must be 5 MB or smaller.');
            return;
        }

        setBlnIsSubmitting(true);

        try
        {
            const objLedger = await submitSetupRepaymentPayment(intProjectId, objInstallment.id, {
                amountPaid: Number(strAmountPaid),
                bankBranch: strBankBranch.trim(),
                checkDate: strCheckDate,
                checkNumber: strCheckNumber.trim(),
                orNumber: strOrNumber.trim(),
                paymentDate: strPaymentDate,
                paymentProof: objPaymentProof,
            });
            onSubmitted(objLedger);
        } catch (errSubmitError)
        {
            reportError(errSubmitError, 'LogPaymentModal: handle submit failed.');

            setStrError(repaymentErrorMessage(errSubmitError));
            setBlnIsSubmitting(false);
        }
    } /* end _handleSubmit */

    return (
        <ModalShell
            txtDescription={`${objInstallment.period} · Due ${_formatDate(objInstallment.dueDate)}`}
            objFooter={
                <div className="flex justify-end gap-2">
                    <button
                        className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                        disabled={blnIsSubmitting}
                        onClick={onClose}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white hover:bg-[#0b3f8b] disabled:opacity-50"
                        disabled={blnIsSubmitting}
                        form="setup-payment-form"
                        type="submit"
                    >
                        {blnIsSubmitting ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                        {blnIsSubmitting ? 'Submitting…' : 'Submit payment'}
                    </button>
                </div>
            }
            onClose={onClose}
            title="Log Payment"
            strWidth="md"
        >
            <div className="space-y-5">
                <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                    <span className="text-sm font-semibold text-blue-700">Balance due</span>
                    <span className="font-black text-[#073b82]">
                        {_formatCurrency(objInstallment.remainingAmount)}
                    </span>
                </div>

                <form
                    className="grid gap-4 sm:grid-cols-2"
                    id="setup-payment-form"
                    onSubmit={(objEvent) => void _handleSubmit(objEvent)}
                >
                    <label className="text-sm font-bold text-slate-800">
                        Amount paid <span className="text-rose-600">*</span>
                        <input
                            className={INPUT_CLASS_NAME}
                            inputMode="decimal"
                            max={objInstallment.remainingAmount}
                            min="0.01"
                            onChange={(objEvent) => setStrAmountPaid(objEvent.target.value)}
                            required
                            step="0.01"
                            type="number"
                            value={strAmountPaid}
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-800">
                        Payment date <span className="text-rose-600">*</span>
                        <input
                            className={INPUT_CLASS_NAME}
                            max={_localDate()}
                            onChange={(objEvent) => setStrPaymentDate(objEvent.target.value)}
                            required
                            type="date"
                            value={strPaymentDate}
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-800">
                        OR number <span className="text-rose-600">*</span>
                        <input
                            className={INPUT_CLASS_NAME}
                            inputMode="numeric"
                            maxLength={100}
                            onChange={(objEvent) =>
                                setStrOrNumber(objEvent.target.value.replace(/\D/g, ''))
                            }
                            pattern="[0-9]*"
                            placeholder="Enter OR number"
                            required
                            value={strOrNumber}
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-800">
                        Bank branch <span className="text-rose-600">*</span>
                        <input
                            className={INPUT_CLASS_NAME}
                            maxLength={150}
                            onChange={(objEvent) => setStrBankBranch(objEvent.target.value)}
                            placeholder="Bank and branch"
                            required
                            value={strBankBranch}
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-800">
                        Check number <span className="text-rose-600">*</span>
                        <input
                            className={INPUT_CLASS_NAME}
                            maxLength={100}
                            onChange={(objEvent) => setStrCheckNumber(objEvent.target.value)}
                            placeholder="Check number"
                            required
                            value={strCheckNumber}
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-800">
                        Check date <span className="text-rose-600">*</span>
                        <input
                            className={INPUT_CLASS_NAME}
                            onChange={(objEvent) => setStrCheckDate(objEvent.target.value)}
                            required
                            type="date"
                            value={strCheckDate}
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-800 sm:col-span-2">
                        Official receipt <span className="text-rose-600">*</span>
                        <span className="mt-1.5 flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 transition hover:border-[#0f53b7] hover:bg-blue-50/50">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                                {objPaymentProof ? (
                                    <CheckCircle2 className="size-5" />
                                ) : (
                                    <Upload className="size-5" />
                                )}
                            </span>
                            <span className="min-w-0 font-normal">
                                <span className="block truncate font-bold text-slate-800">
                                    {objPaymentProof?.name ?? 'Upload OR photo or PDF'}
                                </span>
                                <span className="block text-xs text-slate-500">
                                    JPG, PNG, or PDF · up to 5 MB
                                </span>
                            </span>
                            <input
                                accept="image/jpeg,image/png,application/pdf"
                                className="sr-only"
                                onChange={(objEvent) =>
                                {
                                    setObjPaymentProof(objEvent.target.files?.[0] ?? null);
                                    setStrError(null);
                                }}
                                required
                                type="file"
                            />
                        </span>
                    </label>
                </form>

                {strError ? (
                    <div
                        className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                        role="alert"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {strError}
                    </div>
                ) : null}
            </div>
        </ModalShell>
    ); // end return
} /* end LogPaymentModal */

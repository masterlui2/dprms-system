/**
 * System: DPRMS
 * Purpose: Manage repayment ledger store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios, { AxiosError } from 'axios';
import type {
    ApiLedger,
    LedgerResponse,
    PaymentReviewStatus,
    ProjectsResponse,
    RepaymentStatus,
} from '../types/api/repayment_ledger';
import { reportError } from '../utils/error_reporting';
export type { PaymentReviewStatus, RepaymentStatus } from '../types/api/repayment_ledger';

import g_objApi from '../lib/axios';

export interface RepaymentTransaction
{
    amountPaid: number;
    bankBranch: string;
    checkDate: string | null;
    checkNumber: string;
    hasProof: boolean;
    id: number;
    orNumber: string;
    paymentDate: string | null;
    proofMimeType: string | null;
    proofName: string | null;
    recordedBy: string;
    remarks: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    status: PaymentReviewStatus;
    submittedAt: string | null;
}

export interface SetupRepaymentProject
{
    cooperator: string;
    id: number;
    referenceNumber: string;
    title: string;
}

export interface RepaymentInstallment
{
    amount: number;
    amountPaid: number;
    dueDate: string;
    id: number;
    period: string;
    remainingAmount: number;
    status: RepaymentStatus;
    transactions: RepaymentTransaction[];
}

export interface RepaymentScheduleInput
{
    amortizationStartDate: string;
    fullReleaseDate: string;
    installments: Array<{
        amount: number;
        dueDate: string;
        periodLabel: string;
    }>;
    repaymentTermMonths: number;
    totalProjectCost: number;
}

export interface SetupRepaymentLedger
{
    installments: RepaymentInstallment[];
    permissions: {
        canManageSchedule: boolean;
        canRecordPayment: boolean;
        canVerifyPayment: boolean;
        readOnly: boolean;
    };
    schedule: {
        amortizationStartDate: string | null;
        fullReleaseDate: string | null;
        initialized: boolean;
        locked: boolean;
        repaymentTermMonths: number | null;
        scheduledTotal: number;
    };
    project: {
        cooperator: string;
        contactNumber: string | null;
        fullRelease: string | null;
        id: number;
        location: string;
        referenceNumber: string;
        status: string;
        title: string;
    };
    summary: {
        amountPaid: number;
        outstandingBalance: number;
        overdueInstallments: number;
        totalProjectCost: number;
    };
}

interface ApiErrorPayload
{
    errors?: Record<string, string[]>;
    message?: string;
}

/** Map ledger. */
function _mapLedger(objLedger: ApiLedger): SetupRepaymentLedger
{
    return {
        installments: objLedger.installments.map((objInstallment) => ({
            amount: objInstallment.amount,
            amountPaid: objInstallment.amount_paid,
            dueDate: objInstallment.due_date,
            id: objInstallment.id,
            period: objInstallment.period,
            remainingAmount: objInstallment.remaining_amount,
            status: objInstallment.status,
            transactions: objInstallment.transactions.map((objTransaction) => ({
                amountPaid: objTransaction.amount_paid,
                bankBranch: objTransaction.bank_branch,
                checkDate: objTransaction.check_date,
                checkNumber: objTransaction.check_number,
                hasProof: objTransaction.has_proof,
                id: objTransaction.id,
                orNumber: objTransaction.or_number,
                paymentDate: objTransaction.payment_date,
                proofMimeType: objTransaction.proof_mime_type,
                proofName: objTransaction.proof_name,
                recordedBy: objTransaction.recorded_by,
                remarks: objTransaction.remarks,
                reviewedAt: objTransaction.reviewed_at,
                reviewedBy: objTransaction.reviewed_by,
                status: objTransaction.status,
                submittedAt: objTransaction.submitted_at,
            })),
        })),
        permissions: {
            canManageSchedule: objLedger.permissions.can_manage_schedule,
            canRecordPayment: objLedger.permissions.can_record_payment,
            canVerifyPayment: objLedger.permissions.can_verify_payment,
            readOnly: objLedger.permissions.read_only,
        },
        project: {
            cooperator: objLedger.project.cooperator,
            contactNumber: objLedger.project.contact_number,
            fullRelease: objLedger.project.full_release,
            id: objLedger.project.id,
            location: objLedger.project.location,
            referenceNumber: objLedger.project.reference_number || `SETUP-${objLedger.project.id}`,
            status: objLedger.project.status,
            title: objLedger.project.title || 'SETUP Project',
        },
        schedule: {
            amortizationStartDate: objLedger.schedule.amortization_start_date,
            fullReleaseDate: objLedger.schedule.full_release_date,
            initialized: objLedger.schedule.initialized,
            locked: objLedger.schedule.locked,
            repaymentTermMonths: objLedger.schedule.repayment_term_months,
            scheduledTotal: objLedger.schedule.scheduled_total,
        },
        summary: {
            amountPaid: objLedger.summary.amount_paid,
            outstandingBalance: objLedger.summary.outstanding_balance,
            overdueInstallments: objLedger.summary.overdue_installments,
            totalProjectCost: objLedger.summary.total_project_cost,
        },
    };
} /* end _mapLedger */

/** Repayment error message. */
export function repaymentErrorMessage(errError: unknown): string
{
    if (axios.isAxiosError(errError))
    {
        const errAxiosError = errError as AxiosError<ApiErrorPayload>;
        const objErrors = errAxiosError.response?.data?.errors;
        const strFirstError = objErrors ? Object.values(objErrors)[0]?.[0] : null;
        return (
            strFirstError ??
            errAxiosError.response?.data?.message ??
            'The repayment request could not be completed.'
        );
    }

    return errError instanceof Error
        ? errError.message
        : 'The repayment request could not be completed.';
}

/** Fetch setup repayment ledger. */
export async function fetchSetupRepaymentLedger(
    intProjectId: number,
): Promise<SetupRepaymentLedger>
{
    try
    {
        const objResponse = await g_objApi.get<LedgerResponse>(
            `/setup/projects/${intProjectId}/ledger`,
        );
        return _mapLedger(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'repayment_ledger_store: fetch setup repayment ledger failed.');
        throw errOperation;
    }
}

/** Save setup repayment schedule. */
export async function saveSetupRepaymentSchedule(
    intProjectId: number,
    objPayload: RepaymentScheduleInput,
): Promise<SetupRepaymentLedger>
{
    try
    {
        const objResponse = await g_objApi.put<LedgerResponse>(
            `/setup/projects/${intProjectId}/ledger/schedule`,
            {
                amortization_start_date: objPayload.amortizationStartDate,
                full_release_date: objPayload.fullReleaseDate,
                installments: objPayload.installments.map((objInstallment) => ({
                    amount: objInstallment.amount,
                    due_date: objInstallment.dueDate,
                    period_label: objInstallment.periodLabel.trim(),
                })),
                repayment_term_months: objPayload.repaymentTermMonths,
                total_project_cost: objPayload.totalProjectCost,
            },
        );

        return _mapLedger(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'repayment_ledger_store: save setup repayment schedule failed.');
        throw errOperation;
    }
} /* end saveSetupRepaymentSchedule */

/** Fetch my setup repayment projects. */
export async function fetchMySetupRepaymentProjects(): Promise<SetupRepaymentProject[]>
{
    try
    {
        const objResponse = await g_objApi.get<ProjectsResponse>('/setup/repayment/projects');
        return objResponse.data.data.map((objProject) => ({
            cooperator: objProject.cooperator || 'SETUP Cooperator',
            id: objProject.id,
            referenceNumber: objProject.reference_number || `SETUP-${objProject.id}`,
            title: objProject.title || 'SETUP Project',
        }));
    } catch (errOperation)
    {
        reportError(
            errOperation,
            'repayment_ledger_store: fetch my setup repayment projects failed.',
        );
        throw errOperation;
    }
}

/** Submit setup repayment payment. */
export async function submitSetupRepaymentPayment(
    intProjectId: number,
    intInstallmentId: number,
    objPayload: {
        amountPaid: number;
        bankBranch: string;
        checkDate: string;
        checkNumber: string;
        orNumber: string;
        paymentDate: string;
        paymentProof: File;
    },
): Promise<SetupRepaymentLedger>
{
    try
    {
        const objFormData = new FormData();
        objFormData.append('amount_paid', String(objPayload.amountPaid));
        objFormData.append('bank_branch', objPayload.bankBranch);
        objFormData.append('check_date', objPayload.checkDate);
        objFormData.append('check_number', objPayload.checkNumber);
        objFormData.append('or_number', objPayload.orNumber);
        objFormData.append('payment_date', objPayload.paymentDate);
        objFormData.append('payment_proof', objPayload.paymentProof);

        const objResponse = await g_objApi.post<LedgerResponse>(
            `/setup/projects/${intProjectId}/ledger/${intInstallmentId}/payments`,
            objFormData,
            { headers: { 'Content-Type': undefined } },
        );
        return _mapLedger(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'repayment_ledger_store: submit setup repayment payment failed.');
        throw errOperation;
    }
} /* end submitSetupRepaymentPayment */

/** Fetch setup repayment proof. */
export async function fetchSetupRepaymentProof(
    intProjectId: number,
    intInstallmentId: number,
    intTransactionId: number,
): Promise<Blob>
{
    try
    {
        const objResponse = await g_objApi.get<Blob>(
            `/setup/projects/${intProjectId}/ledger/${intInstallmentId}/payments/${intTransactionId}/proof`,
            { responseType: 'blob' },
        );
        return objResponse.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'repayment_ledger_store: fetch setup repayment proof failed.');
        throw errOperation;
    }
}

/** Verify setup repayment payment. */
export async function verifySetupRepaymentPayment(
    intProjectId: number,
    intInstallmentId: number,
    intTransactionId: number,
    objPayload: {
        decision: 'verified' | 'rejected';
        remarks?: string;
    },
): Promise<SetupRepaymentLedger>
{
    try
    {
        const objResponse = await g_objApi.patch<LedgerResponse>(
            `/setup/projects/${intProjectId}/ledger/${intInstallmentId}/payments/${intTransactionId}`,
            {
                decision: objPayload.decision,
                remarks: objPayload.remarks?.trim() || undefined,
            },
        );
        return _mapLedger(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'repayment_ledger_store: verify setup repayment payment failed.');
        throw errOperation;
    }
}

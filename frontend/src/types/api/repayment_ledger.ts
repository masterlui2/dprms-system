/**
 * System: DPRMS
 * Purpose: Describe the current repayment ledger API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

export type RepaymentStatus = 'pending' | 'paid' | 'overdue';

export type PaymentReviewStatus = 'pending' | 'verified' | 'rejected';

export interface ApiTransaction
{
    amount_paid: number;
    bank_branch: string;
    check_date: string | null;
    check_number: string;
    has_proof: boolean;
    id: number;
    or_number: string;
    payment_date: string | null;
    proof_mime_type: string | null;
    proof_name: string | null;
    recorded_by: string;
    remarks: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    status: PaymentReviewStatus;
    submitted_at: string | null;
}

export interface ApiRepaymentProject
{
    cooperator: string | null;
    id: number;
    reference_number: string | null;
    title: string | null;
}

export interface ApiInstallment
{
    amount: number;
    amount_paid: number;
    due_date: string;
    id: number;
    period: string;
    remaining_amount: number;
    status: RepaymentStatus;
    transactions: ApiTransaction[];
}

export interface ApiLedger
{
    installments: ApiInstallment[];
    permissions: {
        can_manage_schedule: boolean;
        can_record_payment: boolean;
        can_verify_payment: boolean;
        read_only: boolean;
    };
    schedule: {
        amortization_start_date: string | null;
        full_release_date: string | null;
        initialized: boolean;
        locked: boolean;
        repayment_term_months: number | null;
        scheduled_total: number;
    };
    project: {
        cooperator: string;
        contact_number: string | null;
        full_release: string | null;
        id: number;
        location: string;
        reference_number: string | null;
        status: string;
        title: string | null;
    };
    summary: {
        amount_paid: number;
        outstanding_balance: number;
        overdue_installments: number;
        total_project_cost: number;
    };
}

export interface LedgerResponse
{
    data: ApiLedger;
    message: string;
}

export interface ProjectsResponse
{
    data: ApiRepaymentProject[];
    message: string;
}

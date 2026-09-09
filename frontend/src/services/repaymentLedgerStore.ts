import axios, { AxiosError } from 'axios'

import api from '../lib/axios'

export type RepaymentStatus = 'pending' | 'paid' | 'overdue'
export type PaymentReviewStatus = 'pending' | 'verified' | 'rejected'

export interface RepaymentTransaction {
  amountPaid: number
  bankBranch: string
  checkDate: string | null
  checkNumber: string
  hasProof: boolean
  id: number
  orNumber: string
  paymentDate: string | null
  proofMimeType: string | null
  proofName: string | null
  recordedBy: string
  remarks: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  status: PaymentReviewStatus
  submittedAt: string | null
}

export interface SetupRepaymentProject {
  cooperator: string
  id: number
  referenceNumber: string
  title: string
}

export interface RepaymentInstallment {
  amount: number
  amountPaid: number
  dueDate: string
  id: number
  period: string
  remainingAmount: number
  status: RepaymentStatus
  transactions: RepaymentTransaction[]
}

export interface RepaymentScheduleInput {
  amortizationStartDate: string
  fullReleaseDate: string
  installments: Array<{
    amount: number
    dueDate: string
    periodLabel: string
  }>
  repaymentTermMonths: number
  totalProjectCost: number
}

export interface SetupRepaymentLedger {
  installments: RepaymentInstallment[]
  permissions: {
    canManageSchedule: boolean
    canRecordPayment: boolean
    canVerifyPayment: boolean
    readOnly: boolean
  }
  schedule: {
    amortizationStartDate: string | null
    fullReleaseDate: string | null
    initialized: boolean
    locked: boolean
    repaymentTermMonths: number | null
    scheduledTotal: number
  }
  project: {
    cooperator: string
    contactNumber: string | null
    fullRelease: string | null
    id: number
    location: string
    referenceNumber: string
    status: string
    title: string
  }
  summary: {
    amountPaid: number
    outstandingBalance: number
    overdueInstallments: number
    totalProjectCost: number
  }
}

interface ApiTransaction {
  amount_paid: number
  bank_branch: string
  check_date: string | null
  check_number: string
  has_proof: boolean
  id: number
  or_number: string
  payment_date: string | null
  proof_mime_type: string | null
  proof_name: string | null
  recorded_by: string
  remarks: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  status: PaymentReviewStatus
  submitted_at: string | null
}

interface ApiRepaymentProject {
  cooperator: string | null
  id: number
  reference_number: string | null
  title: string | null
}

interface ApiInstallment {
  amount: number
  amount_paid: number
  due_date: string
  id: number
  period: string
  remaining_amount: number
  status: RepaymentStatus
  transactions: ApiTransaction[]
}

interface ApiLedger {
  installments: ApiInstallment[]
  permissions: {
    can_manage_schedule: boolean
    can_record_payment: boolean
    can_verify_payment: boolean
    read_only: boolean
  }
  schedule: {
    amortization_start_date: string | null
    full_release_date: string | null
    initialized: boolean
    locked: boolean
    repayment_term_months: number | null
    scheduled_total: number
  }
  project: {
    cooperator: string
    contact_number: string | null
    full_release: string | null
    id: number
    location: string
    reference_number: string | null
    status: string
    title: string | null
  }
  summary: {
    amount_paid: number
    outstanding_balance: number
    overdue_installments: number
    total_project_cost: number
  }
}

interface LedgerResponse {
  data: ApiLedger
  message: string
}

interface ProjectsResponse {
  data: ApiRepaymentProject[]
  message: string
}

interface ApiErrorPayload {
  errors?: Record<string, string[]>
  message?: string
}

function mapLedger(ledger: ApiLedger): SetupRepaymentLedger {
  return {
    installments: ledger.installments.map((installment) => ({
      amount: installment.amount,
      amountPaid: installment.amount_paid,
      dueDate: installment.due_date,
      id: installment.id,
      period: installment.period,
      remainingAmount: installment.remaining_amount,
      status: installment.status,
      transactions: installment.transactions.map((transaction) => ({
        amountPaid: transaction.amount_paid,
        bankBranch: transaction.bank_branch,
        checkDate: transaction.check_date,
        checkNumber: transaction.check_number,
        hasProof: transaction.has_proof,
        id: transaction.id,
        orNumber: transaction.or_number,
        paymentDate: transaction.payment_date,
        proofMimeType: transaction.proof_mime_type,
        proofName: transaction.proof_name,
        recordedBy: transaction.recorded_by,
        remarks: transaction.remarks,
        reviewedAt: transaction.reviewed_at,
        reviewedBy: transaction.reviewed_by,
        status: transaction.status,
        submittedAt: transaction.submitted_at,
      })),
    })),
    permissions: {
      canManageSchedule: ledger.permissions.can_manage_schedule,
      canRecordPayment: ledger.permissions.can_record_payment,
      canVerifyPayment: ledger.permissions.can_verify_payment,
      readOnly: ledger.permissions.read_only,
    },
    project: {
      cooperator: ledger.project.cooperator,
      contactNumber: ledger.project.contact_number,
      fullRelease: ledger.project.full_release,
      id: ledger.project.id,
      location: ledger.project.location,
      referenceNumber: ledger.project.reference_number || `SETUP-${ledger.project.id}`,
      status: ledger.project.status,
      title: ledger.project.title || 'SETUP Project',
    },
    schedule: {
      amortizationStartDate: ledger.schedule.amortization_start_date,
      fullReleaseDate: ledger.schedule.full_release_date,
      initialized: ledger.schedule.initialized,
      locked: ledger.schedule.locked,
      repaymentTermMonths: ledger.schedule.repayment_term_months,
      scheduledTotal: ledger.schedule.scheduled_total,
    },
    summary: {
      amountPaid: ledger.summary.amount_paid,
      outstandingBalance: ledger.summary.outstanding_balance,
      overdueInstallments: ledger.summary.overdue_installments,
      totalProjectCost: ledger.summary.total_project_cost,
    },
  }
}

export function repaymentErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>
    const errors = axiosError.response?.data?.errors
    const firstError = errors ? Object.values(errors)[0]?.[0] : null
    return firstError ?? axiosError.response?.data?.message ?? 'The repayment request could not be completed.'
  }

  return error instanceof Error ? error.message : 'The repayment request could not be completed.'
}

export async function fetchSetupRepaymentLedger(projectId: number): Promise<SetupRepaymentLedger> {
  const response = await api.get<LedgerResponse>(`/setup/projects/${projectId}/ledger`)
  return mapLedger(response.data.data)
}

export async function saveSetupRepaymentSchedule(
  projectId: number,
  payload: RepaymentScheduleInput,
): Promise<SetupRepaymentLedger> {
  const response = await api.put<LedgerResponse>(
    `/setup/projects/${projectId}/ledger/schedule`,
    {
      amortization_start_date: payload.amortizationStartDate,
      full_release_date: payload.fullReleaseDate,
      installments: payload.installments.map((installment) => ({
        amount: installment.amount,
        due_date: installment.dueDate,
        period_label: installment.periodLabel.trim(),
      })),
      repayment_term_months: payload.repaymentTermMonths,
      total_project_cost: payload.totalProjectCost,
    },
  )

  return mapLedger(response.data.data)
}

export async function fetchMySetupRepaymentProjects(): Promise<SetupRepaymentProject[]> {
  const response = await api.get<ProjectsResponse>('/setup/repayment/projects')
  return response.data.data.map((project) => ({
    cooperator: project.cooperator || 'SETUP Cooperator',
    id: project.id,
    referenceNumber: project.reference_number || `SETUP-${project.id}`,
    title: project.title || 'SETUP Project',
  }))
}

export async function submitSetupRepaymentPayment(
  projectId: number,
  installmentId: number,
  payload: {
    amountPaid: number
    bankBranch: string
    checkDate: string
    checkNumber: string
    orNumber: string
    paymentDate: string
    paymentProof: File
  },
): Promise<SetupRepaymentLedger> {
  const formData = new FormData()
  formData.append('amount_paid', String(payload.amountPaid))
  formData.append('bank_branch', payload.bankBranch)
  formData.append('check_date', payload.checkDate)
  formData.append('check_number', payload.checkNumber)
  formData.append('or_number', payload.orNumber)
  formData.append('payment_date', payload.paymentDate)
  formData.append('payment_proof', payload.paymentProof)

  const response = await api.post<LedgerResponse>(
    `/setup/projects/${projectId}/ledger/${installmentId}/payments`,
    formData,
    { headers: { 'Content-Type': undefined } },
  )
  return mapLedger(response.data.data)
}

export async function fetchSetupRepaymentProof(
  projectId: number,
  installmentId: number,
  transactionId: number,
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/setup/projects/${projectId}/ledger/${installmentId}/payments/${transactionId}/proof`,
    { responseType: 'blob' },
  )
  return response.data
}

export async function verifySetupRepaymentPayment(
  projectId: number,
  installmentId: number,
  transactionId: number,
  payload: {
    decision: 'verified' | 'rejected'
    remarks?: string
  },
): Promise<SetupRepaymentLedger> {
  const response = await api.patch<LedgerResponse>(
    `/setup/projects/${projectId}/ledger/${installmentId}/payments/${transactionId}`,
    {
      decision: payload.decision,
      remarks: payload.remarks?.trim() || undefined,
    },
  )
  return mapLedger(response.data.data)
}

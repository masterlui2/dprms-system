import axios, { AxiosError } from 'axios'

import type { EquipmentRecord, Program } from '../data/admin'
import api from '../lib/axios'

type ApiCondition = 'good' | 'fair' | 'poor' | 'non-functional'

interface EquipmentApiRecord {
  id: number
  asset_reference: string
  equipment_name: string
  serial_number: string | null
  brand: string | null
  model: string | null
  condition: ApiCondition
  status: string
  last_checked_at: string | null
  program_type: Program
  category: string | null
  organization: string
  location: string
  project: {
    id: number | null
    reference_number: string | null
    title: string | null
    program_type: Program
  }
  qr_code: {
    reference: string
    data: string
    is_active: boolean
  } | null
}

interface EquipmentListResponse {
  data: EquipmentApiRecord[]
}

interface EquipmentItemResponse {
  data: EquipmentApiRecord
  message: string
}

interface ApiErrorPayload {
  errors?: Record<string, string[]>
  message?: string
}

const conditionLabels: Record<ApiCondition, EquipmentRecord['condition']> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  'non-functional': 'Non-functional',
}

function formatCheckedAt(value: string | null): string {
  if (!value) return 'Not yet inspected'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not yet inspected'

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function mapStatus(status: string): EquipmentRecord['status'] {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'issued') return 'Issued'
  if (normalized === 'returned') return 'Returned'
  return 'In storage'
}

function mapEquipment(record: EquipmentApiRecord): EquipmentRecord {
  return {
    assignedTo: record.organization,
    backendId: record.id,
    brand: record.brand,
    category: record.category,
    condition: conditionLabels[record.condition],
    id: record.asset_reference,
    lastCheckedAt: record.last_checked_at,
    lastScanned: formatCheckedAt(record.last_checked_at),
    location: record.location,
    model: record.model,
    name: record.equipment_name,
    program: record.program_type,
    projectId: record.project.reference_number ?? `Project ${record.project.id ?? 'not linked'}`,
    projectTitle: record.project.title ?? 'Project title not recorded',
    qrData: record.qr_code?.data ?? null,
    qrReference: record.qr_code?.reference ?? null,
    serialNumber: record.serial_number,
    status: mapStatus(record.status),
  }
}

export function equipmentErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>
    const errors = axiosError.response?.data?.errors
    const firstError = errors ? Object.values(errors)[0]?.[0] : null
    return firstError ?? axiosError.response?.data?.message ?? 'The equipment request could not be completed.'
  }

  if (error instanceof Error && error.message) return error.message

  return 'The equipment request could not be completed.'
}

export async function fetchEquipment(): Promise<EquipmentRecord[]> {
  const response = await api.get<EquipmentListResponse>('/v1/equipment')
  return response.data.data.map(mapEquipment)
}

export async function resolveEquipmentQr(qrData: string): Promise<EquipmentRecord> {
  const userAgent = navigator.userAgent
  const deviceType = /Mobi|Android/i.test(userAgent) ? 'mobile' : 'desktop'
  const response = await api.post<EquipmentItemResponse>('/v1/equipment/qr/resolve', {
    qr_data: qrData,
    device_type: deviceType,
    browser: userAgent.slice(0, 100),
  })

  return mapEquipment(response.data.data)
}

export async function submitEquipmentInspection({
  asset,
  condition,
  remarks,
}: {
  asset: EquipmentRecord
  condition: ApiCondition
  remarks: string
}): Promise<EquipmentRecord> {
  if (!asset.backendId || !asset.qrReference) {
    throw new Error('This asset does not have an active backend QR record.')
  }

  const response = await api.post<EquipmentItemResponse>(
    `/v1/equipment/${asset.backendId}/inspections`,
    {
      condition,
      remarks: remarks.trim() || null,
      qr_reference: asset.qrReference,
    },
  )

  return mapEquipment(response.data.data)
}

export type InspectionCondition = ApiCondition

import axios, { AxiosError } from 'axios'

import type { EquipmentRecord, Program } from '../data/admin'
import api from '../lib/axios'

type ApiCondition = 'good' | 'fair' | 'poor' | 'non-functional'

interface EquipmentApiRecord {
  acquisition_cost: number
  acquisition_date: string | null
  id: number
  asset_reference: string
  equipment_name: string
  serial_number: string | null
  brand: string | null
  model: string | null
  condition: ApiCondition
  status: string
  last_checked_at: string | null
  installed_at: string | null
  program_type: Program
  category: string | null
  organization: string
  location: string
  property_number: string | null
  supplier_name: string | null
  specifications: string | null
  unit: string | null
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
  inspection_history: Array<{
    id: number
    previous_condition: ApiCondition
    condition: ApiCondition
    observations: string | null
    recommendations: string | null
    inspected_at: string
    inspector: string
    photos: string[]
  }>
}

interface EquipmentListResponse {
  data: EquipmentApiRecord[]
  statistics: EquipmentStatistics
  filters: { categories: EquipmentCategoryOption[] }
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
  if (['condemned', 'lost', 'transferred'].includes(normalized)) return 'Unavailable'
  return 'In storage'
}

function mapEquipment(record: EquipmentApiRecord): EquipmentRecord {
  return {
    acquisitionCost: record.acquisition_cost,
    acquisitionDate: record.acquisition_date,
    assignedTo: record.organization,
    backendId: record.id,
    brand: record.brand,
    category: record.category,
    condition: conditionLabels[record.condition],
    id: record.asset_reference,
    inspectionHistory: (record.inspection_history ?? []).map((entry) => ({
      condition: conditionLabels[entry.condition],
      id: entry.id,
      inspectedAt: entry.inspected_at,
      inspector: entry.inspector,
      observations: entry.observations,
      photos: entry.photos,
      previousCondition: conditionLabels[entry.previous_condition],
      recommendations: entry.recommendations,
    })),
    installationDate: record.installed_at,
    lastCheckedAt: record.last_checked_at,
    lastScanned: formatCheckedAt(record.last_checked_at),
    location: record.location,
    model: record.model,
    name: record.equipment_name,
    propertyNumber: record.property_number,
    program: record.program_type,
    projectId: record.project.reference_number ?? `Project ${record.project.id ?? 'not linked'}`,
    projectTitle: record.project.title ?? 'Project title not recorded',
    qrData: record.qr_code?.data ?? null,
    qrReference: record.qr_code?.reference ?? null,
    serialNumber: record.serial_number,
    specifications: record.specifications,
    status: mapStatus(record.status),
    supplier: record.supplier_name,
    unit: record.unit,
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

export interface EquipmentStatistics {
  condition_alerts: number
  currently_issued: number
  good_condition: number
  total_equipment: number
}

export interface EquipmentCategoryOption {
  category_code: string
  category_name: string
  id: number
}

export interface EquipmentProjectOption {
  cooperator: string
  id: number
  location: string
  program_type: Program
  reference_number: string
  title: string
}

export interface EquipmentRegistrationOptions {
  categories: EquipmentCategoryOption[]
  programs: Program[]
  projects: EquipmentProjectOption[]
}

export interface EquipmentRegistrationPayload {
  acquisition_cost: number
  acquisition_date: string
  brand: string
  category_id: number
  current_condition: 'GOOD' | 'FAIR' | 'POOR' | 'NON_FUNCTIONAL'
  equipment_name: string
  installed_at?: string
  location: string
  model: string
  notes?: string
  program_type: Program
  project_id: number
  property_number?: string
  serial_number: string
  specifications?: string
  supplier_name: string
  unit: string
}

export interface EquipmentInventoryResult {
  categories: EquipmentCategoryOption[]
  equipment: EquipmentRecord[]
  statistics: EquipmentStatistics
}

export async function fetchEquipment(filters: {
  categoryId?: number
  condition?: string
  program?: Program
  search?: string
} = {}): Promise<EquipmentInventoryResult> {
  const response = await api.get<EquipmentListResponse>('/v1/equipment', {
    params: {
      category_id: filters.categoryId,
      condition: filters.condition,
      program_type: filters.program,
      search: filters.search,
    },
  })
  return {
    categories: response.data.filters?.categories ?? [],
    equipment: response.data.data.map(mapEquipment),
    statistics: response.data.statistics,
  }
}

export async function fetchEquipmentDetails(id: number): Promise<EquipmentRecord> {
  const response = await api.get<EquipmentItemResponse>(`/v1/equipment/${id}`)
  return mapEquipment(response.data.data)
}

export async function fetchEquipmentRegistrationOptions(program?: Program): Promise<EquipmentRegistrationOptions> {
  const response = await api.get<{ data: EquipmentRegistrationOptions }>('/v1/equipment/options', {
    params: { program_type: program },
  })
  return response.data.data
}

export async function registerEquipment(payload: EquipmentRegistrationPayload): Promise<EquipmentRecord> {
  const response = await api.post<EquipmentItemResponse>('/v1/equipment', payload)
  return mapEquipment(response.data.data)
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
  recommendations,
  inspectionDate,
  photos,
}: {
  asset: EquipmentRecord
  condition: ApiCondition
  remarks: string
  recommendations: string
  inspectionDate: string
  photos: File[]
}): Promise<EquipmentRecord> {
  if (!asset.backendId || !asset.qrReference) {
    throw new Error('This asset does not have an active backend QR record.')
  }

  const formData = new FormData()
  formData.append('condition', condition)
  formData.append('remarks', remarks.trim())
  formData.append('recommendations', recommendations.trim())
  formData.append('inspection_date', inspectionDate)
  formData.append('qr_reference', asset.qrReference)
  photos.forEach((photo) => formData.append('photos[]', photo))

  const response = await api.post<EquipmentItemResponse>(
    `/v1/equipment/${asset.backendId}/inspections`,
    formData,
    { headers: { 'Content-Type': undefined } },
  )

  return mapEquipment(response.data.data)
}

export type InspectionCondition = ApiCondition

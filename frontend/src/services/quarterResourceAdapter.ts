// src/services/quarterResourceAdapters.ts

import type { SetupMonitoringQuarterRecord } from '../types/setupMonitoring'
import { normalizeMonitoringDate } from '../utils/monitoringDate'

export interface ResourceAdapter<TFrontend = any> {
  endpoint: string // e.g. "product" -> /quarterly-metrics/{id}/product/batch
  recordKey: keyof any // the array on SetupMonitoringQuarterRecord this pulls from
  extraOnCreate?: (item: TFrontend) => Record<string, any> // e.g. fixed `type`
  toPayload: (
    item: TFrontend,
    record?: SetupMonitoringQuarterRecord,
  ) => Record<string, any> // shared create/update field map
}

export const productAdapter: ResourceAdapter = {
  endpoint: 'product',
  recordKey: 'sales',
  toPayload: (p: any) => ({
    product_name: p.productName,
    specifications: p.specifications,
    unit: p.unit,
    price: p.sellingPrice,
    quantity: p.quantity,
  }),
}

export const productionMaterialAdapter: ResourceAdapter = {
  endpoint: 'production-material',
  recordKey: 'rawMaterials',
  toPayload: (m: any) => ({
    materials: m.rawMaterialName,
    unit: m.unit,
    quantity: m.quantity,
    cost: m.costPerUnit,
  }),
}

export const assetCapitalAdapter: ResourceAdapter = {
  endpoint: 'asset-capital',
  recordKey: 'workingCapital',
  toPayload: (w: any) => ({
    name: w.particulars,
    amount: w.amount,
  }),
}

// Costs: 3 frontend arrays -> 1 backend resource, distinguished by `type`
export function costAdapter(
  recordKey: 'operatingExpenses' | 'laborExpenses' | 'miscellaneousExpenses',
  type: 'OPERATION' | 'LABOR' | 'MISCELLANEOUS',
): ResourceAdapter {
  return {
    endpoint: 'cost',
    recordKey,
    toPayload: (c: any) => ({
      particulars: c.particulars,
      type,
      month_1: c.month1,
      month_2: c.month2,
      month_3: c.month3,
    }),
  }
}

// Assets: 2 frontend arrays -> 1 backend resource.
// Backend has no building/equipment column — it heuristically buckets by
// regex /building/i on `type` when re-fetched. We stamp that marker
// ourselves so round-tripping doesn't misclassify.
export function assetAdapter(
  recordKey: 'buildingAssets' | 'equipmentAssets',
  kind: 'Building' | 'Equipment',
): ResourceAdapter {
  return {
    endpoint: 'asset',
    recordKey,
    toPayload: (a: any) => ({
      asset_name: kind === 'Building' ? a.buildingName : a.equipmentName,
      type: `${kind}: ${kind === 'Building' ? a.buildingType : a.equipmentType}`,
      lifespan: a.usefulLifeYears,
      year_acquired: a.yearAcquired,
      cost: a.cost,
    }),
  }
}

// Linkages: 2 frontend arrays -> 1 backend resource.
// FIXED: BatchLinkageRequest validates `in:forward,backward` (spelled
// correctly). The previous 'foward' typo here caused every distributor
// create/update to fail validation. If a 'foward' typo genuinely exists
// in the DB enum/migration, fix it there instead of re-introducing it here.
export function linkageAdapter(
  recordKey: 'forwardDistributors' | 'forwardSuppliers',
  type: 'forward' | 'backward',
): ResourceAdapter {
  return {
    endpoint: 'linkage',
    recordKey,
    toPayload: (l: any) => ({
      name: l.name,
      type,
      male_quantity: l.male,
      female_quantity: l.female,
    }),
  }
}

// DECISION (see conversation): backend enum only supports
// ['None', 'PWD', 'Senior']. Frontend UI keeps its own richer set
// ('SC' | 'Youth' | 'PWD' | 'None') for display/filtering, but on the wire
// we map SC -> Senior and Youth -> None. This is a lossy write: a "Youth"
// employee is stored server-side indistinguishable from "None". If youth
// counts ever need to reappear after a refetch (see
// mapBackendQuarterlyMetric in setupMonitoringStore.ts), they will NOT come
// back as 'Youth' — they'll come back as 'None', because the information
// no longer exists once persisted. computeEmploymentTotals' youthCount will
// undercount for anyone re-loaded from the backend rather than kept in
// local component state since their last edit.
function toBackendSectoralGroup(group: string): 'None' | 'PWD' | 'Senior' {
  if (group === 'SC') return 'Senior'
  if (group === 'Youth') return 'None'
  if (group === 'PWD') return 'PWD'
  return 'None'
}

// Employees: backend has NO direct/indirect column yet (see note 3 in
// mapBackendQuarterlyMetric). Both arrays merge into the same resource;
// on refetch everything currently lands back in directEmployees.
export function employeeAdapter(
  recordKey: 'directEmployees' | 'indirectEmployees',
): ResourceAdapter {
  return {
    endpoint: 'employee',
    recordKey,
    toPayload: (e: any) => ({
      employee_name: e.name,
      age: e.age,
      // FIXED: backend Rule::in expects 'Part-Timer' (capital T); frontend
      // EmployeeItem type uses 'Part-timer'. Normalize here so the type
      // definition doesn't have to change everywhere it's used in the UI.
      status: e.employmentStatus === 'Part-timer' ? 'Part-Timer' : e.employmentStatus,
      gender: e.sex,
      sectoral_group: toBackendSectoralGroup(e.sectoralGroup),
      days_of_attendance: e.workdaysQuarter,
      salary_rate: e.salaryRate,
    }),
  }
}

// Markets: backend has NO international/local column yet — same caveat as employees.
export function marketAdapter(
  recordKey: 'internationalMarkets' | 'localMarkets',
): ResourceAdapter {
  return {
    endpoint: 'market',
    recordKey,
    toPayload: (m: any, record) => {
      const effectiveDate = normalizeMonitoringDate(m.effectivityDate, record?.year)

      return {
        market_name: m.marketName,
        address: m.address,
        condition: (m.condition || 'NEW').toLowerCase(),
        ...(effectiveDate ? { effective_date: effectiveDate } : {}),
        contact_person: m.contactPerson,
        service: m.productServiceSold,
        volume: m.volumeDelivered,
      }
    },
  }
}

// Interventions: 5 frontend arrays -> 1 backend resource, distinguished by `type`.
export function interventionAdapter(
  recordKey: 'consultancies' | 'trainings' | 'techTransfers' | 'supportServices' | 'otherProjects',
  type: 'CONSULTANCY' | 'TRAINING' | 'TECHNOLOGY' | 'TESTING' | 'OTHERS',
): ResourceAdapter {
  return {
    endpoint: 'intervention',
    recordKey,
    toPayload: (item: any, record) => {
      const date = normalizeMonitoringDate(item.date, record?.year)
      const datePayload = date ? { date } : {}

      switch (type) {
        case 'CONSULTANCY':
          return { name: item.serviceName, type, availed: !!item.availed, intervention: item.areaOfIntervention, ...datePayload }
        case 'TRAINING':
          return { name: item.trainingName, type, availed: true, intervention: item.category, ...datePayload }
        case 'TECHNOLOGY':
          return { name: item.details, type, availed: true, intervention: item.type, ...datePayload }
        case 'TESTING':
          return { name: item.productTestedParameters, type, availed: true, intervention: item.type, ...datePayload }
        case 'OTHERS':
          return { name: item.projectTitle, type, availed: true, intervention: 'N/A', ...datePayload }
      }
    },
  }
}

export const RESOURCE_ADAPTERS: ResourceAdapter[] = [
  productAdapter,
  productionMaterialAdapter,
  assetCapitalAdapter,
  costAdapter('operatingExpenses', 'OPERATION'),
  costAdapter('laborExpenses', 'LABOR'),
  costAdapter('miscellaneousExpenses', 'MISCELLANEOUS'),
  assetAdapter('buildingAssets', 'Building'),
  assetAdapter('equipmentAssets', 'Equipment'),
  linkageAdapter('forwardDistributors', 'forward'),
  linkageAdapter('forwardSuppliers', 'backward'),
  employeeAdapter('directEmployees'),
  employeeAdapter('indirectEmployees'),
  marketAdapter('internationalMarkets'),
  marketAdapter('localMarkets'),
  interventionAdapter('consultancies', 'CONSULTANCY'),
  interventionAdapter('trainings', 'TRAINING'),
  interventionAdapter('techTransfers', 'TECHNOLOGY'),
  interventionAdapter('supportServices', 'TESTING'),
  interventionAdapter('otherProjects', 'OTHERS'),
]

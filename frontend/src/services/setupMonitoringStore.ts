import type {
  BuildingAsset,
  ConsultancyItem,
  EmployeeItem,
  EquipmentAsset,
  MarketOutletItem,
  MonthlyExpenseItem,
  OtherDostProjectItem,
  ProductSalesItem,
  Quarter,
  RawMaterialItem,
  SetupMonitoringQuarterRecord,
  SupportServiceItem,
  TechTransferItem,
  TrainingItem,
  WorkerCount,
  WorkingCapitalItem,
} from '../types/setupMonitoring'
import type { ProjectRecord } from '../data/admin'
import api from '../lib/axios'
import type { ProjectPagination } from '../types/monitoring'

const STORAGE_PREFIX = 'dprms_setup_monitoring_record_'

function createEmptyQuarterRecord(
  projectId: string,
  year: number,
  quarter: Quarter,
): SetupMonitoringQuarterRecord {
  return {
    id: `${projectId}-${year}-${quarter}`,
    projectId,
    enterpriseName: '',
    enterpriseAddress: '',
    year,
    quarter,
    dateOfVisit: '',
    status: 'Draft',
    buildingAssets: [],
    equipmentAssets: [],
    workingCapital: [],
    internationalMarkets: [],
    localMarkets: [],
    forwardDistributors: [],
    forwardSuppliers: [],
    directEmployees: [],
    indirectEmployees: [],
    consultancies: [],
    trainings: [],
    techTransfers: [],
    supportServices: [],
    otherProjects: [],
    operatingExpenses: [],
    laborExpenses: [],
    rawMaterials: [],
    miscellaneousExpenses: [],
    sales: [],
    problemsAndActions: {
      humanResource: '',
      technical: '',
      financial: '',
      market: '',
    },
    plansForImprovement: {
      humanResource: '',
      technical: '',
      financial: '',
      market: '',
    },
    signOff: {
      interviewerName: '',
      interviewerDesignation: '',
      interviewerSignatureDate: '',
      respondentName: '',
      respondentDesignation: '',
      respondentSignatureDate: '',
      dateOfVisit: '',
    },
  }
}

export function calculateBuildingDepreciation(cost: number, usefulLifeYears: number): number {
  if (!usefulLifeYears || usefulLifeYears <= 0) return 0
  return Math.round((cost / usefulLifeYears) * 100) / 100
}

export function calculateBuildingBookValue(
  cost: number,
  usefulLifeYears: number,
  yearAcquired: number,
  currentYear = 2026,
): number {
  if (!usefulLifeYears || usefulLifeYears <= 0) return 0
  const depreciation = calculateBuildingDepreciation(cost, usefulLifeYears)
  const elapsedYears = Math.max(0, currentYear - yearAcquired)
  return Math.max(0, Math.round((cost - elapsedYears * depreciation) * 100) / 100)
}

export function calculateEquipmentDepreciation(cost: number, usefulLifeYears: number): number {
  if (!usefulLifeYears || usefulLifeYears <= 0) return 0
  return Math.round((cost / usefulLifeYears) * 100) / 100
}

export function calculateEquipmentBookValue(
  cost: number,
  usefulLifeYears: number,
  yearAcquired: number,
  currentYear = 2026,
): number {
  if (!usefulLifeYears || usefulLifeYears <= 0) return 0
  const depreciation = calculateEquipmentDepreciation(cost, usefulLifeYears)
  const elapsedYears = Math.max(0, currentYear - yearAcquired)
  return Math.max(0, Math.round((cost - elapsedYears * depreciation) * 100) / 100)
}

export function computeSalesTotals(record: SetupMonitoringQuarterRecord) {
  const grandTotalSales = record.sales.reduce((sum, item) => sum + (item.totalSales || 0), 0)
  const costTotals = computeProductionCostTotals(record)
  const netProfit = grandTotalSales - costTotals.grandTotalProductionCost
  const profitMargin =
    grandTotalSales > 0 ? Math.round((netProfit / grandTotalSales) * 1000) / 10 : 0

  return {
    grandTotalSales,
    netProfit,
    profitMargin,
  }
}

export function computeProductionCostTotals(record: SetupMonitoringQuarterRecord) {
  const operatingTotal = record.operatingExpenses.reduce((sum, item) => sum + (item.total || 0), 0)
  const laborTotal = record.laborExpenses.reduce((sum, item) => sum + (item.total || 0), 0)
  const rawMaterialsTotal = record.rawMaterials.reduce((sum, item) => sum + (item.totalCost || 0), 0)
  const miscTotal = record.miscellaneousExpenses.reduce((sum, item) => sum + (item.total || 0), 0)

  const grandTotalProductionCost = operatingTotal + laborTotal + rawMaterialsTotal + miscTotal

  return {
    operatingTotal,
    laborTotal,
    rawMaterialsTotal,
    miscTotal,
    grandTotalProductionCost,
  }
}

export function computeEmploymentTotals(record: SetupMonitoringQuarterRecord) {
  const allEmployees = [...record.directEmployees, ...record.indirectEmployees]
  const totalEmployees = allEmployees.length
  const maleCount = allEmployees.filter((e) => e.sex === 'Male').length
  const femaleCount = allEmployees.filter((e) => e.sex === 'Female').length

  const scCount = allEmployees.filter((e) => e.sectoralGroup === 'SC').length
  const youthCount = allEmployees.filter((e) => e.sectoralGroup === 'Youth').length
  const pwdCount = allEmployees.filter((e) => e.sectoralGroup === 'PWD').length

  const directSalaryTotal = record.directEmployees.reduce(
    (sum, e) => sum + (e.totalSalaryQuarter || 0),
    0,
  )
  const indirectSalaryTotal = record.indirectEmployees.reduce(
    (sum, e) => sum + (e.totalSalaryQuarter || 0),
    0,
  )

  const regularCount = allEmployees.filter((e) => e.employmentStatus === 'Regular').length
  const contractualCount = allEmployees.filter((e) => e.employmentStatus !== 'Regular').length

  const forwardDistributorMale = record.forwardDistributors.reduce((sum, d) => sum + (d.male || 0), 0)
  const forwardDistributorFemale = record.forwardDistributors.reduce((sum, d) => sum + (d.female || 0), 0)
  const forwardDistributorTotal = record.forwardDistributors.reduce((sum, d) => sum + (d.total || 0), 0)

  const forwardSupplierMale = record.forwardSuppliers.reduce((sum, s) => sum + (s.male || 0), 0)
  const forwardSupplierFemale = record.forwardSuppliers.reduce((sum, s) => sum + (s.female || 0), 0)
  const forwardSupplierTotal = record.forwardSuppliers.reduce((sum, s) => sum + (s.total || 0), 0)

  return {
    totalEmployees,
    maleCount,
    femaleCount,
    scCount,
    youthCount,
    pwdCount,
    directSalaryTotal,
    indirectSalaryTotal,
    regularCount,
    contractualCount,
    forwardDistributorMale,
    forwardDistributorFemale,
    forwardDistributorTotal,
    forwardSupplierMale,
    forwardSupplierFemale,
    forwardSupplierTotal,
  }
}

export function createDefaultQuarterRecord(
  projectId: string,
  year = 2026,
  quarter: Quarter = 'Q2',
): SetupMonitoringQuarterRecord {
  return {
    id: `${projectId}-${year}-${quarter}`,
    projectId,
    enterpriseName: 'Madayaway Food Products',
    enterpriseAddress: 'Lower Kapayas, Brgy. Matiao, Mati City, Davao Oriental',
    year,
    quarter,
    dateOfVisit: '2026-06-20',
    status: 'Verified',

    buildingAssets: [
      {
        id: 'b1',
        buildingName: 'Production Building',
        buildingType: 'Concrete',
        usefulLifeYears: 30,
        yearAcquired: 2017,
        cost: 500000,
        depreciation: 16666.67,
        bookValue: 383333.33,
      },
    ],

    equipmentAssets: [
      {
        id: 'eq1',
        equipmentName: 'Large Format Printer & Packaging Machine',
        equipmentType: 'Technical and Scientific Equipment',
        usefulLifeYears: 10,
        yearAcquired: 2016,
        cost: 1000000,
        depreciation: 100000,
        bookValue: 500000,
      },
    ],

    workingCapital: [
      { id: 'wc1', particulars: 'Production Cost', amount: 154000 },
      { id: 'wc2', particulars: 'Representation & Logistics', amount: 25000 },
    ],

    internationalMarkets: [
      {
        id: 'im1',
        marketType: 'INTERNATIONAL',
        marketName: 'Target Supercenter Export',
        address: 'New York, NY, USA',
        condition: 'OLD',
        effectivityDate: '',
        contactPerson: 'Maria Dela Cruz',
        productServiceSold: 'Coconut Vinegar / Wine Condiments',
        volumeDelivered: '5000 bottles',
      },
    ],

    localMarkets: [
      {
        id: 'lm1',
        marketType: 'LOCAL',
        marketName: 'Subangan Museum Souvenir Shop',
        address: 'Mati, Davao Oriental',
        condition: 'OLD',
        effectivityDate: '',
        contactPerson: 'Maria Dela Cruz',
        productServiceSold: 'Bottles of Vinegar & Sauces',
        volumeDelivered: '5000 bottles',
      },
      {
        id: 'lm2',
        marketType: 'LOCAL',
        marketName: 'ER Supermall Supermarket',
        address: 'Mati City Center',
        condition: 'OLD',
        effectivityDate: '',
        contactPerson: 'Manager Jocelyn',
        productServiceSold: 'Assorted Gourmet Condiments',
        volumeDelivered: '2400 bottles',
      },
      {
        id: 'lm3',
        marketType: 'LOCAL',
        marketName: 'Abreeza Mall Davao Outlet',
        address: 'JP Laurel Ave, Davao City',
        condition: 'NEW',
        effectivityDate: '2026-04-15',
        contactPerson: 'Arthur Tan',
        productServiceSold: 'Spiced Vinegar Series',
        volumeDelivered: '3200 bottles',
      },
    ],

    forwardDistributors: [
      { id: 'fd1', name: 'ER Supermall', male: 0, female: 1, total: 1 },
      { id: 'fd2', name: 'Tita Venus Catering', male: 0, female: 1, total: 1 },
      { id: 'fd3', name: 'Subangan Museum', male: 0, female: 1, total: 1 },
      { id: 'fd4', name: 'Pasalubong Center (Pintatagan)', male: 0, female: 1, total: 1 },
      { id: 'fd5', name: 'DTI-Go Negosyo Center', male: 0, female: 1, total: 1 },
      { id: 'fd6', name: 'Abreeza Davao Retail Hub', male: 1, female: 3, total: 4 },
      { id: 'fd7', name: 'Panabo Public Market Stalls', male: 2, female: 1, total: 3 },
      { id: 'fd8', name: 'Tagum Public Market Hub', male: 1, female: 1, total: 2 },
      { id: 'fd9', name: 'Piapi-Boulevard Public Market', male: 0, female: 1, total: 1 },
      { id: 'fd10', name: 'Digos Public Market', male: 0, female: 1, total: 1 },
    ],

    forwardSuppliers: [
      { id: 'fs1', name: 'Itok Raw Coconut Supply', male: 1, female: 0, total: 1 },
      { id: 'fs2', name: 'Enteng Neri Farm', male: 1, female: 0, total: 1 },
      { id: 'fs3', name: 'Jun Mahusay Spices', male: 1, female: 0, total: 1 },
      { id: 'fs4', name: 'Mati Spice Growers', male: 2, female: 3, total: 5 },
      { id: 'fs5', name: 'Davao Bottle & Glass Packaging', male: 5, female: 0, total: 5 },
      { id: 'fs6', name: 'Recycling Junkshop Partner', male: 3, female: 0, total: 3 },
      { id: 'fs7', name: 'Delia Caraga Agri', male: 0, female: 1, total: 1 },
    ],

    directEmployees: [
      {
        id: 'de1',
        type: 'DIRECT',
        name: 'Juana Dela Cruz',
        age: 19,
        employmentStatus: 'Regular',
        sex: 'Female',
        sectoralGroup: 'Youth',
        workdaysQuarter: 24,
        salaryType: 'Daily',
        salaryRate: 250,
        totalSalaryQuarter: 27000,
      },
      {
        id: 'de2',
        type: 'DIRECT',
        name: 'Ricardo Neri',
        age: 34,
        employmentStatus: 'Regular',
        sex: 'Male',
        sectoralGroup: 'None',
        workdaysQuarter: 26,
        salaryType: 'Monthly',
        salaryRate: 15000,
        totalSalaryQuarter: 45000,
      },
    ],

    indirectEmployees: [
      {
        id: 'ie1',
        type: 'INDIRECT',
        name: 'Jocelyn Morales',
        age: 28,
        employmentStatus: 'Project-Based',
        sex: 'Female',
        sectoralGroup: 'Youth',
        workdaysQuarter: 24,
        salaryType: 'Monthly',
        salaryRate: 18000,
        totalSalaryQuarter: 54000,
      },
      {
        id: 'ie2',
        type: 'INDIRECT',
        name: 'Enteng Gomez',
        age: 62,
        employmentStatus: 'Contract-Based',
        sex: 'Male',
        sectoralGroup: 'SC',
        workdaysQuarter: 20,
        salaryType: 'Daily',
        salaryRate: 350,
        totalSalaryQuarter: 21000,
      },
    ],

    consultancies: [
      { id: 'c1', serviceName: 'MPEX (Manufacturing Productivity Extension)', availed: true, areaOfIntervention: 'Plant layout optimization and sanitation flow', date: '2026-03-12' },
      { id: 'c2', serviceName: 'CPT (Cleaner Production Technology)', availed: false, areaOfIntervention: '', date: '' },
      { id: 'c3', serviceName: 'Energy Audit', availed: true, areaOfIntervention: 'Power load monitoring and heat insulation', date: '2026-04-05' },
      { id: 'c4', serviceName: 'Plant Layout (FS)', availed: true, areaOfIntervention: 'Hazard analysis flow restructuring', date: '2026-02-18' },
      { id: 'c5', serviceName: 'GMP Assessment', availed: true, areaOfIntervention: 'Compliance pre-audit for FDA LTO renewal', date: '2026-05-10' },
      { id: 'c6', serviceName: 'In-House GMP Training', availed: true, areaOfIntervention: 'All production and handling personnel', date: '2026-05-15' },
      { id: 'c7', serviceName: 'Packaging and Labelling', availed: true, areaOfIntervention: 'Nutritional fact sheet and barcode label redesign', date: '2026-03-22' },
    ],

    trainings: [
      { id: 't1', category: 'DOST', trainingName: 'DOST Food Safety & Basic Sanitation Seminar', date: '2026-02-25' },
      { id: 't2', category: 'RDI', trainingName: 'Thermal Processing and Fermentation Controls (ITDI/FNRI)', date: '2026-04-12' },
      { id: 't3', category: 'FPIC', trainingName: 'FPIC Davao Regional Product Standardization Workshop', date: '2026-05-08' },
    ],

    techTransfers: [
      { id: 'tt1', type: 'TNA', details: 'Technological Needs Assessment on Automated Filling Line', date: '2026-01-20' },
      { id: 'tt2', type: 'EQUIPMENT', details: 'Turnover of 1 Unit Semi-Automatic Liquid Bottle Filler & Capper', date: '2026-03-15' },
      { id: 'tt3', type: 'PRODUCTS_DEVELOPED', details: 'Spiced Vinegar Long Neck (Export Grade Variant)', date: '2026-04-10' },
    ],

    supportServices: [
      { id: 'ss1', type: 'Microbiology', productTestedParameters: 'E. Coli, Salmonella, Yeast and Mold Count - Passed', date: '2026-03-30' },
      { id: 'ss2', type: 'Chemical', productTestedParameters: 'Acidity titration, pH level, heavy metals screening', date: '2026-03-30' },
      { id: 'ss3', type: 'Calibration', productTestedParameters: 'Digital refractometer and temperature probe calibration', date: '2026-02-14' },
      { id: 'ss4', type: 'Shelf Life', productTestedParameters: 'Accelerated 18-month shelf-life stability test protocol', date: '2026-05-02' },
    ],

    otherProjects: [
      { id: 'op1', projectTitle: 'DOST Packaging Assistance Program (PapBox)', date: '2026-01-15' },
    ],

    operatingExpenses: [
      { id: 'oe1', particulars: 'Power (Electricity)', month1: 4200, month2: 4600, month3: 4900, total: 13700 },
      { id: 'oe2', particulars: 'Water Utility', month1: 1100, month2: 1250, month3: 1300, total: 3650 },
      { id: 'oe3', particulars: 'Rent of Facility', month1: 8000, month2: 8000, month3: 8000, total: 24000 },
      { id: 'oe4', particulars: 'Fuel (Vehicles & Operations)', month1: 3500, month2: 4100, month3: 3800, total: 11400 },
      { id: 'oe5', particulars: 'Internet & Communications', month1: 1800, month2: 1800, month3: 1800, total: 5400 },
      { id: 'oe6', particulars: 'Equipment Maintenance', month1: 1200, month2: 800, month3: 2200, total: 4200 },
      { id: 'oe7', particulars: 'PHIC Premium Expense', month1: 1400, month2: 1400, month3: 1400, total: 4200 },
      { id: 'oe8', particulars: 'SSS Premium Expense', month1: 2800, month2: 2800, month3: 2800, total: 8400 },
      { id: 'oe9', particulars: 'Distribution Commissions', month1: 2500, month2: 3200, month3: 3000, total: 8700 },
    ],

    laborExpenses: [
      { id: 'le1', particulars: 'Regular Employees Payroll', month1: 24000, month2: 24000, month3: 24000, total: 72000 },
      { id: 'le2', particulars: 'Contractual / Project Labor', month1: 15000, month2: 18000, month3: 17000, total: 50000 },
    ],

    rawMaterials: [
      { id: 'rm1', rawMaterialName: 'Tuba / Fermented Sap', unit: 'Liters', quantity: 3500, costPerUnit: 15, totalCost: 52500 },
      { id: 'rm2', rawMaterialName: 'Garlic Bulbs', unit: 'Kilograms', quantity: 180, costPerUnit: 120, totalCost: 21600 },
      { id: 'rm3', rawMaterialName: 'Native Chili (Siling Labuyo)', unit: 'Kilograms', quantity: 95, costPerUnit: 180, totalCost: 17100 },
      { id: 'rm4', rawMaterialName: 'Red Onion', unit: 'Kilograms', quantity: 120, costPerUnit: 100, totalCost: 12000 },
      { id: 'rm5', rawMaterialName: 'Ginger / Luya', unit: 'Kilograms', quantity: 80, costPerUnit: 90, totalCost: 7200 },
      { id: 'rm6', rawMaterialName: 'Iodized Sea Salt', unit: 'Sacks (25kg)', quantity: 15, costPerUnit: 450, totalCost: 6750 },
      { id: 'rm7', rawMaterialName: 'Langkawas / Blue Ginger', unit: 'Kilograms', quantity: 45, costPerUnit: 110, totalCost: 4950 },
      { id: 'rm8', rawMaterialName: 'LPG Gas Refill', unit: 'Tanks (50kg)', quantity: 6, costPerUnit: 2200, totalCost: 13200 },
    ],

    miscellaneousExpenses: [
      { id: 'me1', particulars: 'Sanitation Supplies & Disinfectants', month1: 1500, month2: 1200, month3: 1800, total: 4500 },
      { id: 'me2', particulars: 'Packaging Tape & Corrugated Boxes', month1: 2400, month2: 2800, month3: 3100, total: 8300 },
    ],

    sales: [
      { id: 's1', productName: "Ric's Vinegar Junior Lapad", specifications: 'SC (Spiced Classic)', unit: 'Bottles (350ml)', sellingPrice: 45, quantity: 2400, totalSales: 108000 },
      { id: 's2', productName: "Ric's Vinegar Junior Lapad", specifications: 'SH (Spiced Hot)', unit: 'Bottles (350ml)', sellingPrice: 48, quantity: 1800, totalSales: 86400 },
      { id: 's3', productName: "Ric's Vinegar Junior Lapad", specifications: 'SW (Sweet & Sour)', unit: 'Bottles (350ml)', sellingPrice: 50, quantity: 1200, totalSales: 60000 },
      { id: 's4', productName: "Ric's Vinegar Senior Lapad", specifications: 'SC (Spiced Classic)', unit: 'Bottles (500ml)', sellingPrice: 65, quantity: 1600, totalSales: 104000 },
      { id: 's5', productName: "Ric's Vinegar Senior Lapad", specifications: 'SH (Spiced Hot)', unit: 'Bottles (500ml)', sellingPrice: 68, quantity: 1400, totalSales: 95200 },
      { id: 's6', productName: "Ric's Vinegar Long Neck", specifications: 'SC (Spiced Classic Premium)', unit: 'Bottles (750ml)', sellingPrice: 95, quantity: 950, totalSales: 90250 },
      { id: 's7', productName: "Ric's Vinegar Long Neck", specifications: 'SH (Spiced Hot Premium)', unit: 'Bottles (750ml)', sellingPrice: 98, quantity: 820, totalSales: 80360 },
    ],

    problemsAndActions: {
      humanResource: 'Temporary shortage of contractual bottle-washers during seasonal harvest surge; addressed by optimizing line rotation and scheduling weekend shifts with overtime incentive.',
      technical: 'Minor temperature fluctuations on heat-sealing band on packaging line; calibrated heating elements with DOST testing engineer assistance.',
      financial: 'Delayed payment remittances from provincial public market consignment partners; instituted standard 15-day collection window and direct bank deposit terms.',
      market: 'Chili price spikes due to heavy monsoon rains in Upper Davao; negotiated fixed quarterly volume agreement with local agricultural cooperative.',
    },

    plansForImprovement: {
      humanResource: 'Hire 2 additional regular packaging workers and enroll supervisors in DOST HACCP Level 2 accreditation.',
      technical: 'Procure 1 unit semi-automated rotary bottle labeling applicator to double output speed.',
      financial: 'Reinvest 25% of quarterly net profit into bulk raw spice inventory reserve.',
      market: 'Expand institutional distribution footprint to Panabo Supermarkets and online pasalubong delivery platforms.',
    },

    signOff: {
      interviewerName: 'ENGR. GLENN D. MORALES',
      interviewerDesignation: 'PSTO Davao Oriental - Science Research Specialist II',
      interviewerSignatureDate: '2026-06-25',
      respondentName: 'JUANA DELA CRUZ',
      respondentDesignation: 'General Manager / Enterprise Representative',
      respondentSignatureDate: '2026-06-25',
      dateOfVisit: '2026-06-20',
    },
  }
}

export function getQuarterRecord(
  projectId: string,
  year = 2026,
  quarter: Quarter = 'Q2',
): SetupMonitoringQuarterRecord {
  const key = `${STORAGE_PREFIX}${projectId}_${year}_${quarter}`
  try {
    const item = localStorage.getItem(key)
    if (item) {
      return JSON.parse(item) as SetupMonitoringQuarterRecord
    }
  } catch {
    // fallback
  }

  return createEmptyQuarterRecord(projectId, year, quarter)
}

export function saveQuarterRecord(record: SetupMonitoringQuarterRecord): void {
  const key = `${STORAGE_PREFIX}${record.projectId}_${record.year}_${record.quarter}`
  try {
    localStorage.setItem(key, JSON.stringify(record))
  } catch {
    // ignore
  }
}

export function getAllSavedMonitoringRecords(): SetupMonitoringQuarterRecord[] {
  const records: SetupMonitoringQuarterRecord[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const val = localStorage.getItem(key)
        if (val) {
          records.push(JSON.parse(val))
        }
      }
    }
  } catch {
    // fallback
  }
  return records
}

export interface SetupMonitoringStatistics {
  activeProjects: number
  monitoredCount: number
  pendingReports: number
}

export interface SetupMonitoringProjectFilters {
  search?: string
  district?: string
  year?: number
  quarter?: Quarter
  page?: number
}

export interface SetupMonitoringProjectsResult {
  projects: ProjectRecord[]
  statistics: SetupMonitoringStatistics
  districts: string[]
  pagination: ProjectPagination
}

interface BackendSetupMonitoringProject {
  id: number
  proposal_id: number
  reference_number: string
  title: string
  enterprise_name: string
  contact_number: string | null
  setup_funding: number
  full_release: string | null
  manager: string
  business_address: string | null
  district: string | null
  province: string | null
  status: 'active'
  approved_at: string | null
  start_date: string | null
  expected_end_date: string | null
  monitoring_status: string
  overall_compliance: number
  last_monitored_at: string | null
  monitored: boolean
  pending_reports: number
  checklist_stats: {
    complied: number
    total: number
    percentage: number
  }
  latest_report: {
    status: string
    reporting_period: string
    year: number
    quarter: number | null
    due_date: string | null
  } | null
}

interface BackendSetupMonitoringResponse {
  statistics: {
    active_projects: number
    monitored_count: number
    pending_reports: number
  }
  filters: {
    districts: string[]
  }
  data: BackendSetupMonitoringProject[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

function formatMonitoringDate(value: string | null): string {
  if (!value) return 'Not scheduled'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mapSetupMonitoringProject(project: BackendSetupMonitoringProject): ProjectRecord {
  const location = [project.district, project.province]
    .filter(Boolean)
    .join(', ') || project.business_address || 'Location not recorded'

  return {
    approvedAt: project.approved_at,
    backendId: project.id,
    proposalId: project.proposal_id ?? project.id,
    budget: project.setup_funding,
    compliance: project.pending_reports > 0 ? 'Due soon' : 'Compliant',
    contactNumber: project.contact_number,
    district: project.district ?? undefined,
    dueDate: formatMonitoringDate(project.latest_report?.due_date ?? project.expected_end_date),
    enterprise: project.enterprise_name,
    fullRelease: project.full_release,
    id: String(project.id),
    lastMonitoredAt: project.last_monitored_at,
    checklistStats: project.checklist_stats,
    latestReport: project.latest_report
      ? {
          dueDate: project.latest_report.due_date,
          quarter: project.latest_report.quarter,
          reportingPeriod: project.latest_report.reporting_period,
          status: project.latest_report.status,
          year: project.latest_report.year,
        }
      : null,
    location,
    manager: project.manager,
    monitored: project.monitored,
    monitoringStatus: project.monitoring_status,
    pendingReports: project.pending_reports,
    program: 'SETUP',
    progress: Math.max(0, Math.min(100, Math.round(project.overall_compliance))),
    referenceNumber: project.reference_number,
    status: 'Active',
    title: project.title,
    used: 0,
  }
}

export async function fetchSetupMonitoringProjects(
  filters: SetupMonitoringProjectFilters,
): Promise<SetupMonitoringProjectsResult> {
  const response = await api.get<BackendSetupMonitoringResponse>('/setup/monitoring/projects', {
    params: {
      search: filters.search?.trim() || undefined,
      district: filters.district || undefined,
      year: filters.year,
      quarter: filters.quarter ? Number(filters.quarter.slice(1)) : undefined,
      page: filters.page ?? 1,
    },
  })

  return {
    projects: response.data.data.map(mapSetupMonitoringProject),
    statistics: {
      activeProjects: response.data.statistics.active_projects,
      monitoredCount: response.data.statistics.monitored_count,
      pendingReports: response.data.statistics.pending_reports,
    },
    districts: response.data.filters.districts,
    pagination: {
      currentPage: response.data.pagination.current_page,
      lastPage: response.data.pagination.last_page,
      perPage: response.data.pagination.per_page,
      total: response.data.pagination.total,
      from: response.data.pagination.from,
      to: response.data.pagination.to,
    },
  }
}

// ===========================================================================
// REAL QUARTERLY METRICS (GET /projects/{projectId}/quarterly-metrics)
// ===========================================================================
//
// Everything below replaces createDefaultQuarterRecord's fake Madayaway data
// with the actual backend payload, mapped onto SetupMonitoringQuarterRecord.
// createDefaultQuarterRecord/getQuarterRecord/saveQuarterRecord above are
// left untouched — keep them only if you still want a local-draft/demo path;
// otherwise you can delete createDefaultQuarterRecord once nothing references
// it.

export interface BackendQuarterlyProductItem {
  id: number
  quarter_id: number
  product_name: string
  specifications: string
  unit: string
  price: string
  quantity: number
  gross_sales: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyEmployeeItem {
  id: number
  quarter_id: number
  employee_name: string
  age: number
  status: string
  gender: string
  sectoral_group: string
  days_of_attendance: number
  salary_rate: string
  total_salary: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyProductCostItem {
  id: number
  quarter_id: number
  particulars: string
  type: 'OPERATION' | 'LABOR' | 'MISCELLANEOUS'
  month_1: string
  month_2: string
  month_3: string
  total: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyAssetItem {
  id: number
  quarter_id: number
  asset_name: string
  type: string
  lifespan: number
  year_acquired: number
  cost: string
  depreciation: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyAssetCapitalItem {
  id: number
  quarter_id: number
  name: string
  amount: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyInterventionItem {
  id: number
  quarter_id: number
  name: string
  type: string
  availed: string
  intervention: string
  date: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyLinkageItem {
  id: number
  quarter_id: number
  name: string
  type: string
  male_quantity: number
  female_quantity: number
  total: number
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyMarketItem {
  id: number
  quarter_id: number
  market_name: string
  address: string
  condition: string
  effective_date: string
  contact_person: string
  service: string
  volume: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyNarrativeItem {
  id: number
  quarter_id: number
  particular: string
  type: string
  intervention: string
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyProductionMaterialItem {
  id: number
  quarter_id: number
  materials: string
  unit: string
  quantity: number
  cost: number
  total: number
  created_at: string
  updated_at: string
}

export interface BackendQuarterlyMetric {
  id: number
  project_id: number
  submitted_by: number
  quarter: number
  year: number
  gross_sales: string
  production_volume: number
  employee_count: number
  total_cost: string
  submitted_at: string | null
  created_at: string
  updated_at: string
  products: BackendQuarterlyProductItem[]
  employees: BackendQuarterlyEmployeeItem[]
  product_cost: BackendQuarterlyProductCostItem[]
  asset: BackendQuarterlyAssetItem[]
  asset_capital: BackendQuarterlyAssetCapitalItem[]
  intervention: BackendQuarterlyInterventionItem[]
  linkage: BackendQuarterlyLinkageItem[]
  market: BackendQuarterlyMarketItem[]
  narrative: BackendQuarterlyNarrativeItem[]
  production_material: BackendQuarterlyProductionMaterialItem[]
}

interface BackendQuarterlyMetricsResponse {
  message: string
  data: BackendQuarterlyMetric[]
}

function num(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0
  const n = typeof val === 'number' ? val : parseFloat(val)
  return Number.isFinite(n) ? n : 0
}

function quarterNumberToLabel(q: number): Quarter {
  return `Q${q}` as Quarter
}

// REVERSE of toBackendSectoralGroup in quarterResourceAdapters.ts. Must be
// kept in sync with that mapping.
//
// 'Senior' -> 'SC' round-trips cleanly.
// 'PWD' -> 'PWD' round-trips cleanly.
// 'None' is ambiguous on the way back: it could be a genuine 'None', or it
// could be a former 'Youth' employee that got flattened to 'None' on write
// (see the DECISION note in employeeAdapter). There is no way to recover
// which one it was from this payload alone — the distinction was lost at
// write time. This always resolves to 'None', which means youthCount in
// computeEmploymentTotals will read 0 for any employee loaded from the
// backend, even ones that were originally tagged 'Youth' before their first
// save. If youth tracking needs to survive a round trip, sectoral_group
// needs a real 'Youth' value on the backend — flagging this again in case
// priorities change later, even though it's parked for now.
function fromBackendSectoralGroup(group: string | null | undefined): EmployeeItem['sectoralGroup'] {
  if (group === 'Senior') return 'SC'
  if (group === 'PWD') return 'PWD'
  return 'None'
}

/**
 * Maps a single backend quarterly-metrics record onto the frontend
 * SetupMonitoringQuarterRecord shape.
 *
 * KNOWN BACKEND MISMATCHES — these are heuristics, not real classifications.
 * Do not treat the resulting split (building/equipment, direct/indirect, etc.)
 * as authoritative; it exists so nothing from the API response is silently
 * dropped while the backend contract is still catching up to the frontend
 * model. Revisit each of these once the backend adds the missing column:
 *
 * 1. `asset` — no field distinguishes Building vs Equipment. We bucket by
 *    `type` containing "building" (case-insensitive); everything else is
 *    treated as Equipment.
 * 2. `market` — no field distinguishes International vs Local. Everything
 *    currently lands in `localMarkets` until the backend adds a
 *    classification column.
 * 3. `employees` — no DIRECT/INDIRECT classification. Everything currently
 *    lands in `directEmployees`; `indirectEmployees` stays empty.
 * 4. `linkage.type` is "forward" (distributor) vs "backward" (supplier).
 * 5. `product_cost` — no category (Operating / Labor / Misc). Everything
 *    currently lands in `operatingExpenses`; `laborExpenses` and
 *    `miscellaneousExpenses` stay empty until the backend adds a `category`
 *    column.
 * 6. `intervention.type` should route rows to Consultancy / Training / Tech
 *    Transfer / Support Service / Other Project. Only "CONSULTANCY" has been
 *    observed in sample data — unrecognized types fall back to Consultancy.
 * 7. `narrative` has no HR/Technical/Financial/Market breakdown. Known
 *    backend issue from rush coding — parked, not being fixed right now.
 *    All PROBLEMS-type rows are concatenated into
 *    `problemsAndActions.humanResource` and all PLANS-type rows into
 *    `plansForImprovement.humanResource` as a temporary holding spot.
 * 8. `enterpriseName` / `enterpriseAddress` are not part of this payload —
 *    pass them in via `overrides` from the already-loaded ProjectRecord
 *    (e.g. `project.enterprise`, `project.location`).
 * 9. `status` ('Draft' | 'Verified') and `dateOfVisit` are inferred from
 *    `submitted_at` since there's no dedicated field for either yet.
 * 10. `employees[].sectoral_group` — 'None' is ambiguous (see
 *     fromBackendSectoralGroup above); youth tagging does not survive a
 *     round trip through the backend.
 */
export function mapBackendQuarterlyMetric(
  projectId: string,
  metric: BackendQuarterlyMetric,
  overrides: Partial<
    Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
  > = {},
): SetupMonitoringQuarterRecord {
  const quarter = quarterNumberToLabel(metric.quarter)
  const year = metric.year

  // --- Assets (heuristic building/equipment split, see note 1) ---
  const buildingAssets: BuildingAsset[] = []
  const equipmentAssets: EquipmentAsset[] = []
  for (const a of metric.asset) {
    const cost = num(a.cost)
    const usefulLifeYears = a.lifespan
    const yearAcquired = a.year_acquired
    const depreciation = num(a.depreciation)
    const bookValue = Math.max(
      0,
      Math.round((cost - Math.max(0, year - yearAcquired) * depreciation) * 100) / 100,
    )

    const isBuilding = /^building:/i.test(a.type)
    // strip the "Building: " / "Equipment: " marker we stamp on save
    const cleanType = a.type.replace(/^(building|equipment):\s*/i, '')

    if (isBuilding) {
      buildingAssets.push({
        id: `asset_${a.id}`,
        buildingName: a.asset_name,
        buildingType: cleanType,
        usefulLifeYears,
        yearAcquired,
        cost,
        depreciation,
        bookValue,
      })
    } else {
      equipmentAssets.push({
        id: `asset_${a.id}`,
        equipmentName: a.asset_name,
        equipmentType: cleanType,
        usefulLifeYears,
        yearAcquired,
        cost,
        depreciation,
        bookValue,
      })
    }
  }

  const workingCapital: WorkingCapitalItem[] = metric.asset_capital.map((c) => ({
    id: `wc_${c.id}`,
    particulars: c.name,
    amount: num(c.amount),
  }))

  const sales: ProductSalesItem[] = metric.products.map((p) => ({
    id: `prod_${p.id}`,
    productName: p.product_name,
    specifications: p.specifications,
    unit: p.unit,
    sellingPrice: num(p.price),
    quantity: p.quantity,
    totalSales: num(p.gross_sales),
  }))

  // --- Production cost (see note 5: now routed by `type`) ---
  const operatingExpenses: MonthlyExpenseItem[] = []
  const laborExpenses: MonthlyExpenseItem[] = []
  const miscellaneousExpenses: MonthlyExpenseItem[] = []

  for (const c of metric.product_cost) {
    const item: MonthlyExpenseItem = {
      id: `pc_${c.id}`,
      particulars: c.particulars,
      month1: num(c.month_1),
      month2: num(c.month_2),
      month3: num(c.month_3),
      total: num(c.total),
    }
    if (c.type === 'LABOR') laborExpenses.push(item)
    else if (c.type === 'MISCELLANEOUS') miscellaneousExpenses.push(item)
    else operatingExpenses.push(item) // 'OPERATION' or unrecognized -> default bucket
  }

  const rawMaterials: RawMaterialItem[] = metric.production_material.map((m) => ({
    id: `pm_${m.id}`,
    rawMaterialName: m.materials,
    unit: m.unit,
    quantity: m.quantity,
    costPerUnit: num(m.cost),
    totalCost: num(m.total),
  }))

  // --- Employment (see note 3: everything lands in Direct for now) ---
  const directEmployees: EmployeeItem[] = metric.employees.map((e) => ({
    id: `emp_${e.id}`,
    type: 'DIRECT',
    name: e.employee_name,
    age: e.age,
    employmentStatus: (e.status as EmployeeItem['employmentStatus']) || 'Regular',
    sex: (e.gender as EmployeeItem['sex']) || 'Male',
    sectoralGroup: fromBackendSectoralGroup(e.sectoral_group),
    workdaysQuarter: e.days_of_attendance,
    salaryType: 'Daily',
    salaryRate: num(e.salary_rate),
    totalSalaryQuarter: num(e.total_salary),
  }))
  const indirectEmployees: EmployeeItem[] = []

  // --- Interventions (see note 6: routed by `type`, default = Consultancy) ---
  const consultancies: ConsultancyItem[] = []
  const trainings: TrainingItem[] = []
  const techTransfers: TechTransferItem[] = []
  const supportServices: SupportServiceItem[] = []
  const otherProjects: OtherDostProjectItem[] = []

  for (const iv of metric.intervention) {
    const type = (iv.type || '').toUpperCase()
    const availed = iv.availed === '1' || iv.availed?.toLowerCase() === 'true'

    if (type.includes('TRAIN')) {
      trainings.push({ id: `tr_${iv.id}`, category: 'OTHER', trainingName: iv.name, date: iv.date })
    } else if (type.includes('TECH')) {
      techTransfers.push({ id: `tt_${iv.id}`, type: 'OTHER', details: iv.intervention || iv.name, date: iv.date })
    } else if (type.includes('SUPPORT') || type.includes('TEST') || type.includes('CALIB')) {
      supportServices.push({ id: `ss_${iv.id}`, type: 'Other', productTestedParameters: iv.intervention || iv.name, date: iv.date })
    } else if (type.includes('OTHER') || type.includes('PROJECT')) {
      otherProjects.push({ id: `op_${iv.id}`, projectTitle: iv.name, date: iv.date })
    } else {
      // "CONSULTANCY" and anything unrecognized
      consultancies.push({
        id: `cons_${iv.id}`,
        serviceName: iv.name,
        availed,
        areaOfIntervention: iv.intervention,
        date: iv.date,
      })
    }
  }

  // --- Linkages (routed by `type`, "forward" vs "backward") ---
  const forwardDistributors: WorkerCount[] = []
  const forwardSuppliers: WorkerCount[] = []
  for (const l of metric.linkage) {
    const item: WorkerCount = {
      id: `link_${l.id}`,
      name: l.name,
      male: l.male_quantity,
      female: l.female_quantity,
      total: l.total,
    }
    if (/back/i.test(l.type)) {
      forwardSuppliers.push(item)
    } else {
      forwardDistributors.push(item)
    }
  }

  // --- Markets (see note 2: everything lands in Local for now) ---
  const localMarkets: MarketOutletItem[] = metric.market.map((m) => ({
    id: `mkt_${m.id}`,
    marketType: 'LOCAL',
    marketName: m.market_name,
    address: m.address,
    condition: (m.condition || '').toUpperCase() === 'NEW' ? 'NEW' : 'OLD',
    effectivityDate: m.effective_date,
    contactPerson: m.contact_person,
    productServiceSold: m.service,
    volumeDelivered: m.volume,
  }))
  const internationalMarkets: MarketOutletItem[] = []

  // --- Narratives (see note 7: known backend issue, parked for now) ---
  const problemsText = metric.narrative
    .filter((n) => (n.type || '').toUpperCase().includes('PROBLEM'))
    .map((n) => `${n.particular}${n.intervention ? ` — Action: ${n.intervention}` : ''}`)
    .join('\n')
  const plansText = metric.narrative
    .filter((n) => (n.type || '').toUpperCase().includes('PLAN'))
    .map((n) => `${n.particular}${n.intervention ? ` — Action: ${n.intervention}` : ''}`)
    .join('\n')

  const visitDate = metric.submitted_at ? metric.submitted_at.slice(0, 10) : ''

  return {
    id: `${projectId}-${year}-${quarter}`,
    projectId,
    enterpriseName: overrides.enterpriseName ?? '',
    enterpriseAddress: overrides.enterpriseAddress ?? '',
    year,
    quarter,
    dateOfVisit: visitDate,
    status: metric.submitted_at ? 'Verified' : 'Draft',
    buildingAssets,
    equipmentAssets,
    workingCapital,
    internationalMarkets,
    localMarkets,
    forwardDistributors,
    forwardSuppliers,
    directEmployees,
    indirectEmployees,
    consultancies,
    trainings,
    techTransfers,
    supportServices,
    otherProjects,
    operatingExpenses,
    laborExpenses,
    rawMaterials,
    miscellaneousExpenses,
    sales,
    problemsAndActions: {
      humanResource: problemsText,
      technical: '',
      financial: '',
      market: '',
    },
    plansForImprovement: {
      humanResource: plansText,
      technical: '',
      financial: '',
      market: '',
    },
    signOff: {
      interviewerName: '',
      interviewerDesignation: '',
      interviewerSignatureDate: '',
      respondentName: '',
      respondentDesignation: '',
      respondentSignatureDate: '',
      dateOfVisit: visitDate,
    },
  }
}

/**
 * Fetches real quarterly metrics for a project from
 * GET /projects/{projectId}/quarterly-metrics and returns the record for the
 * requested year/quarter. Falls back to an EMPTY record (not the
 * createDefaultQuarterRecord mock) if the backend has no data for that period
 * yet, so the UI never silently shows fabricated numbers.
 */
export async function fetchQuarterlyMetrics(
  projectId: string,
  year: number,
  quarter: Quarter,
  overrides: Partial<
    Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
  > = {},
): Promise<SetupMonitoringQuarterRecord> {
  const response = await api.get<BackendQuarterlyMetricsResponse>(
    `/projects/${projectId}/quarterly-metrics`,
  )

  const quarterNumber = Number(quarter.replace('Q', ''))
  const match = response.data.data.find(
    (m) => m.quarter === quarterNumber && m.year === year,
  )

  if (!match) {
    return createEmptyQuarterRecord(projectId, year, quarter)
  }

  return mapBackendQuarterlyMetric(projectId, match, overrides)
}

export interface QuarterlyMetricsFetchResult {
  record: SetupMonitoringQuarterRecord
  /**
   * Backend `quarterly_metrics.id` — required for every
   * /quarterly-metrics/{quarterId}/{resource}/batch call. `null` means no
   * row exists yet for this project/year/quarter combo. Call
   * `createQuarterlyMetric()` (below) to create one — that's what
   * `SetupMonitoringHub`'s "Create quarterly metrics" action does — then
   * re-fetch or set this id directly so autosave can start working.
   */
  quarterMetricId: number | null
}

export async function fetchQuarterlyMetricsWithId(
  projectId: string,
  year: number,
  quarter: Quarter,
  overrides: Partial<
    Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
  > = {},
): Promise<QuarterlyMetricsFetchResult> {
  const response = await api.get<BackendQuarterlyMetricsResponse>(
    `/projects/${projectId}/quarterly-metrics`,
  )

  const quarterNumber = Number(quarter.replace('Q', ''))
  const match = response.data.data.find(
    (m) => m.quarter === quarterNumber && m.year === year,
  )

  if (!match) {
    return {
      record: createEmptyQuarterRecord(projectId, year, quarter),
      quarterMetricId: null,
    }
  }

  return {
    record: mapBackendQuarterlyMetric(projectId, match, overrides),
    quarterMetricId: match.id,
  }
}

// ===========================================================================
// CREATE QUARTERLY METRICS ROW (POST /projects/{projectId}/quarterly-metrics)
// ===========================================================================
//
// This is the piece that was missing end-to-end: fetchQuarterlyMetricsWithId
// only ever GETs. When no row exists yet for the selected project/quarter/
// year, `quarterMetricId` comes back `null` and the hub has no way to start
// syncing — everything just sits in the local-draft/localStorage path
// forever. This calls the actual `store()` endpoint your
// StoreQuarterlyMetricsRequest validates against, so a real
// `quarterly_metrics` row gets created and its id can be used for the
// existing batch-sync endpoints immediately afterward.
//
// NOTE on `project_id` in the body: StoreQuarterlyMetricsRequest's unique
// rule reads `$this->input('project_id')`, but the route only supplies
// `{projectId}` as a URL segment — it is NOT automatically merged into the
// request body. Unless the controller does `$request->merge([...])`
// somewhere before validation runs, that closure evaluates against `null`
// project_id, which makes the per-project uniqueness check on
// (project_id, quarter, year) effectively a no-op. Sending `project_id`
// explicitly here is the frontend's only lever on this — the backend
// should also be checked/fixed to merge the route param in before validating.

export interface CreateQuarterlyMetricResponse {
  message: string
  data: BackendQuarterlyMetric
}

export interface CreateQuarterlyMetricError {
  message: string
  errors?: Record<string, string[]>
}

/**
 * Creates a brand-new (empty) quarterly_metrics row for the given project/
 * quarter/year via POST /projects/{projectId}/quarterly-metrics, and returns
 * its backend id. Throws on failure (422 validation — e.g. the quarter/year
 * combo already exists for this project — or any other API error); callers
 * should catch and surface `error.response?.data` as `CreateQuarterlyMetricError`.
 */
export async function createQuarterlyMetric(
  projectId: string,
  year: number,
  quarter: Quarter,
): Promise<number> {
  const quarterNumber = Number(quarter.replace('Q', ''))

  const response = await api.post<CreateQuarterlyMetricResponse>(
    `/projects/${projectId}/quarterly-metrics`,
    {
      // Route already scopes this to the project, but the FormRequest's
      // unique-rule closure reads project_id off the request body (see note
      // above), so it's included here too.
      project_id: Number(projectId),
      quarter: quarterNumber,
      year,
    },
  )

  return response.data.data.id
}

/**
 * Convenience wrapper: creates the quarterly_metrics row, then immediately
 * maps the (empty) response into a SetupMonitoringQuarterRecord + id, in the
 * same shape fetchQuarterlyMetricsWithId returns — so a caller can swap
 * straight from "no backend row" to "backend row ready to sync" without a
 * second round trip.
 */
export async function createQuarterlyMetricWithRecord(
  projectId: string,
  year: number,
  quarter: Quarter,
  overrides: Partial<
    Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
  > = {},
): Promise<QuarterlyMetricsFetchResult> {
  const quarterNumber = Number(quarter.replace('Q', ''))

  const response = await api.post<CreateQuarterlyMetricResponse>(
    `/projects/${projectId}/quarterly-metrics`,
    {
      project_id: Number(projectId),
      quarter: quarterNumber,
      year,
    },
  )

  const created = response.data.data

  return {
    record: mapBackendQuarterlyMetric(projectId, created, overrides),
    quarterMetricId: created.id,
  }
}

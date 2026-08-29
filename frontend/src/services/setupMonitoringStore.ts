import type {
  Quarter,
  SetupMonitoringQuarterRecord,
} from '../types/setupMonitoring'

const STORAGE_PREFIX = 'dprms_setup_monitoring_record_'

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

  const defaultRecord = createDefaultQuarterRecord(projectId, year, quarter)
  return defaultRecord
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
  if (records.length === 0) {
    records.push(createDefaultQuarterRecord('P-214', 2026, 'Q2'))
  }
  return records
}

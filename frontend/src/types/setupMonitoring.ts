export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export type BuildingAsset = {
  id: string
  buildingName: string
  buildingType: string
  usefulLifeYears: number
  yearAcquired: number
  cost: number
  depreciation: number
  bookValue: number
}

export type EquipmentAsset = {
  id: string
  equipmentName: string
  equipmentType: string
  usefulLifeYears: number
  yearAcquired: number
  cost: number
  depreciation: number
  bookValue: number
}

export type WorkingCapitalItem = {
  id: string
  particulars: string
  amount: number
}

export type MarketOutletItem = {
  id: string
  marketType: 'INTERNATIONAL' | 'LOCAL'
  marketName: string
  address: string
  condition: 'OLD' | 'NEW'
  effectivityDate?: string
  contactPerson: string
  productServiceSold: string
  volumeDelivered: string
}

export type WorkerCount = {
  id: string
  name: string
  male: number
  female: number
  total: number
}

export type EmployeeItem = {
  id: string
  type: 'DIRECT' | 'INDIRECT'
  name: string
  age: number
  employmentStatus: 'Regular' | 'Contract-Based' | 'Project-Based' | 'Part-timer'
  sex: 'Male' | 'Female'
  sectoralGroup: 'None' | 'SC' | 'Youth' | 'PWD'
  workdaysQuarter: number
  salaryType: 'Daily' | 'Monthly'
  salaryRate: number
  totalSalaryQuarter: number
}

export type ConsultancyItem = {
  id: string
  serviceName: string
  availed: boolean
  areaOfIntervention: string
  date: string
}

export type TrainingItem = {
  id: string
  category: 'DOST' | 'RDI' | 'FPIC' | 'OTHER'
  trainingName: string
  date: string
}

export type TechTransferItem = {
  id: string
  type: 'TNA' | 'EQUIPMENT' | 'PRODUCTS_DEVELOPED' | 'OTHER'
  details: string
  date: string
}

export type SupportServiceItem = {
  id: string
  type: 'Microbiology' | 'Chemical' | 'Calibration' | 'Shelf Life' | 'Other'
  productTestedParameters: string
  date: string
}

export type OtherDostProjectItem = {
  id: string
  projectTitle: string
  date: string
}

export type MonthlyExpenseItem = {
  id: string
  particulars: string
  month1: number
  month2: number
  month3: number
  total: number
}

export type RawMaterialItem = {
  id: string
  rawMaterialName: string
  unit: string
  quantity: number
  costPerUnit: number
  totalCost: number
}

export type ProductSalesItem = {
  id: string
  productName: string
  specifications: string
  unit: string
  sellingPrice: number
  quantity: number
  totalSales: number
}

export type NarrativeItem = {
  humanResource: string
  technical: string
  financial: string
  market: string
}

export type SignOffMetadata = {
  interviewerName: string
  interviewerDesignation: string
  interviewerSignatureDate: string
  respondentName: string
  respondentDesignation: string
  respondentSignatureDate: string
  dateOfVisit: string
}

export type SetupMonitoringQuarterRecord = {
  id: string
  projectId: string
  enterpriseName: string
  enterpriseAddress: string
  year: number
  quarter: Quarter
  dateOfVisit: string
  status: 'Draft' | 'Submitted' | 'Verified' | 'Requires Revision'

  buildingAssets: BuildingAsset[]
  equipmentAssets: EquipmentAsset[]
  workingCapital: WorkingCapitalItem[]

  internationalMarkets: MarketOutletItem[]
  localMarkets: MarketOutletItem[]
  forwardDistributors: WorkerCount[]
  forwardSuppliers: WorkerCount[]

  directEmployees: EmployeeItem[]
  indirectEmployees: EmployeeItem[]

  consultancies: ConsultancyItem[]
  trainings: TrainingItem[]
  techTransfers: TechTransferItem[]
  supportServices: SupportServiceItem[]
  otherProjects: OtherDostProjectItem[]

  operatingExpenses: MonthlyExpenseItem[]
  laborExpenses: MonthlyExpenseItem[]
  rawMaterials: RawMaterialItem[]
  miscellaneousExpenses: MonthlyExpenseItem[]
  sales: ProductSalesItem[]

  problemsAndActions: NarrativeItem
  plansForImprovement: NarrativeItem
  signOff: SignOffMetadata
}

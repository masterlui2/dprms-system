export type Program = 'GIA' | 'SETUP'

export interface ProposalRecord {
  amount: number
  completeness: number
  id: string
  organization: string
  organizationType?: string
  proponentName?: string
  proponentRole?: string
  program: Program
  reviewer: string
  stage: 0 | 1 | 2 | 3 | 4
  status:
    | 'Pending'
    | 'Under review'
    | 'In Process'
    | 'Executive Approval'
    | 'Approved'
    | 'Rejected'
    | 'Returned for Revision'
    | 'Disapproved'
  submitted: string
  title: string
  proposalId?: number
  remarks?: string | null
  industrySector?: string | null
  enterpriseSize?: string | null
  businessType?: string | null
  location?: string | null
  proponentCategory?: string | null
  researchCategory?: string | null
  contactNumber?: string | null
}

export type ProposalReviewStatus =
  | 'Submitted'
  | 'Document Validation'
  | 'Technical Review'
  | 'Finance Review'
  | 'Executive Approval'
  | 'Approved'
  | 'Disapproved'

export type GiaOutputCategory =
  | 'Publications'
  | 'Patents / IP'
  | 'Products'
  | 'People Services'
  | 'Places & Partnerships'
  | 'Policy'

export interface GiaOutputMetric {
  actual: number
  category: GiaOutputCategory
  description: string
  target: number
}

export interface GiaMonitoringDetails {
  actualAccomplishment: string
  agency: string
  baseStation: string
  catchUpPlan: string
  cooperatingAgencies: string[]
  durationMonths: number
  endDate: string
  issueSummary: string
  latestReport: {
    period: string
    status: 'Approved' | 'Under review' | 'Pending'
    submitted: string
  }
  location: string
  objective: string
  outputs: GiaOutputMetric[]
  milestones?: Array<{
    completionPercentage: number
    description: string
    expectedCompletion: string | null
    id: number
    number: number
    status: string
    title: string
  }>
  reportingPeriod: string
  startDate: string
  suggestedSolution: string
  targetProgress: number
  yearlyBudgets: Array<{
    amount: number
    label: string
  }>
}

export interface ProjectRecord {
  approvedAt?: string | null
  backendId?: number
  budget: number
  compliance: 'Compliant' | 'Due soon' | 'Overdue'
  dueDate: string
  district?: string
  enterprise: string
  id: string
  location?: string
  lastMonitoredAt?: string | null
  latestReport?: {
    dueDate: string | null
    quarter: number | null
    reportingPeriod: string
    status: string
    year: number
  } | null
  manager: string
  monitored?: boolean
  monitoringStatus?: string
  pendingReports?: number
  program: Program
  progress: number
  referenceNumber?: string
  gia?: GiaMonitoringDetails
  status: 'Active' | 'At risk' | 'Completed'
  title: string
  used: number
}

export interface EquipmentRecord {
  assignedTo: string
  backendId?: number
  brand?: string | null
  category?: string | null
  condition: 'Good' | 'Fair' | 'Poor' | 'Non-functional'
  id: string
  lastCheckedAt?: string | null
  lastScanned: string
  location: string
  model?: string | null
  name: string
  program?: Program
  projectId: string
  projectTitle?: string
  qrData?: string | null
  qrReference?: string | null
  serialNumber?: string | null
  status: 'Issued' | 'In storage' | 'Returned'
}

export interface PredictionRecord {
  enterprise: string
  growth: 'Expanding' | 'Stable' | 'Declining'
  projectId: string
  recommendation: 'Renewal recommended' | 'Needs intervention' | 'At risk'
  riskScore: number
  sustainability:
    | 'Sustainable'
    | 'Moderately sustainable'
    | 'Unsustainable'
}

export const proposalRecords: ProposalRecord[] = [
  {
    id: 'PR-2026-041',
    title: 'Cacao Processing Line Modernization',
    organization: 'Bright Foods Cooperative',
    organizationType: 'Cooperative (Private Sector)',
    proponentName: 'Maria Proponent',
    proponentRole: 'General Manager',
    program: 'SETUP',
    amount: 1250000,
    submitted: 'Jun 24, 2026',
    completeness: 100,
    reviewer: 'Initial Review Team',
    stage: 1,
    status: 'Pending',
  },
  {
    id: 'PR-2026-040',
    title: 'Community Water Quality Monitoring',
    organization: 'Davao Oriental State University',
    organizationType: 'Higher Education Institution (SUC)',
    proponentName: 'Dr. Ricardo Santos',
    proponentRole: 'Project Leader / Researcher',
    program: 'GIA',
    amount: 2180000,
    submitted: 'Jun 23, 2026',
    completeness: 100,
    reviewer: 'Ana Reyes',
    stage: 2,
    status: 'Under review',
  },
  {
    id: 'PR-2026-039',
    title: 'Cold Storage Facility Upgrade',
    organization: 'GreenHarvest Producers Enterprise',
    organizationType: 'Sole Proprietorship (Private Sector)',
    proponentName: 'Juan Dela Cruz',
    proponentRole: 'Proprietor',
    program: 'SETUP',
    amount: 950000,
    submitted: 'Jun 21, 2026',
    completeness: 80,
    reviewer: 'Document Screening Team',
    stage: 1,
    status: 'Pending',
  },
  {
    id: 'PR-2026-038',
    title: 'Coastal Livelihood Technology Training',
    organization: 'Baganga Fisherfolk Federation',
    organizationType: 'Non-Profit / NGO Association',
    proponentName: 'Captain Roberto Diaz',
    proponentRole: 'Federation Head',
    program: 'GIA',
    amount: 780000,
    submitted: 'Jun 19, 2026',
    completeness: 100,
    reviewer: 'Budget Review Unit',
    stage: 3,
    status: 'Under review',
  },
  {
    id: 'PR-2026-037',
    title: 'Precision Coffee Roasting System',
    organization: 'Highland Coffee Works',
    organizationType: 'Partnership (Private Sector)',
    proponentName: 'Elena Torres',
    proponentRole: 'Operations Manager',
    program: 'SETUP',
    amount: 680000,
    submitted: 'Jun 16, 2026',
    completeness: 100,
    reviewer: 'Regional Director',
    stage: 4,
    status: 'Approved',
  },
  {
    id: 'PR-2026-036',
    title: 'Ceramics Kiln Efficiency Upgrade',
    organization: 'Lakeside Ceramics',
    organizationType: 'Corporation (Private Sector)',
    proponentName: 'Gabriel Mendoza',
    proponentRole: 'Managing Director',
    program: 'SETUP',
    amount: 680000,
    submitted: 'Jun 14, 2026',
    completeness: 100,
    reviewer: 'Technical Evaluation Team',
    stage: 2,
    status: 'Rejected',
  },
  {
    id: 'PR-2026-035',
    title: 'Seafood Cold Chain Improvement',
    organization: 'Mariner Seafoods Corp.',
    organizationType: 'Corporation (Private Sector)',
    proponentName: 'Sarah Jenkins',
    proponentRole: 'Vice President for Ops',
    program: 'GIA',
    amount: 3100000,
    submitted: 'Jun 12, 2026',
    completeness: 100,
    reviewer: 'Ana Reyes',
    stage: 2,
    status: 'Under review',
  },
  {
    id: 'PR-2026-034',
    title: 'Community Bamboo Product Development',
    organization: 'Cateel Bamboo Association',
    organizationType: 'Community Association',
    proponentName: 'Manuel Carpio',
    proponentRole: 'Association President',
    program: 'GIA',
    amount: 920000,
    submitted: 'Jun 10, 2026',
    completeness: 100,
    reviewer: 'Initial Review Team',
    stage: 1,
    status: 'Pending',
  },
  {
    id: 'PR-2026-033',
    title: 'Automated Furniture Cutting System',
    organization: 'Mati Woodcraft Enterprise',
    organizationType: 'Sole Proprietorship (Private Sector)',
    proponentName: 'Ramon Woodcraft',
    proponentRole: 'Proprietor',
    program: 'SETUP',
    amount: 1450000,
    submitted: 'Jun 8, 2026',
    completeness: 100,
    reviewer: 'Regional Director',
    stage: 4,
    status: 'Approved',
  },
  {
    id: 'PR-2026-032',
    title: 'Fisherfolk Skills and Technology Program',
    organization: 'Boston Coastal Cooperative',
    organizationType: 'Cooperative (Private Sector)',
    proponentName: 'Liza Garcia',
    proponentRole: 'Cooperative Secretary',
    program: 'GIA',
    amount: 840000,
    submitted: 'Jun 6, 2026',
    completeness: 60,
    reviewer: 'Document Screening Team',
    stage: 0,
    status: 'Pending',
  },
  {
    id: 'PR-2026-031',
    title: 'Fruit Drying and Packaging Facility',
    organization: 'Tarragona Fruit Growers Co-op',
    organizationType: 'Cooperative (Private Sector)',
    proponentName: 'Antonio Flores',
    proponentRole: 'Board Chairman',
    program: 'SETUP',
    amount: 1180000,
    submitted: 'Jun 4, 2026',
    completeness: 100,
    reviewer: 'Budget Review Unit',
    stage: 3,
    status: 'Under review',
  },
  {
    id: 'PR-2026-030',
    title: 'Municipal Disaster Data Platform',
    organization: 'Barangay LGU San Isidro',
    organizationType: 'Barangay LGU',
    proponentName: 'Hon. Fernando Cruz',
    proponentRole: 'Barangay Chairman',
    program: 'GIA',
    amount: 2350000,
    submitted: 'Jun 2, 2026',
    completeness: 100,
    reviewer: 'Technical Evaluation Team',
    stage: 2,
    status: 'Rejected',
  },
]

export const projectRecords: ProjectRecord[] = [
  {
    id: 'P-214',
    title: 'Bottling Line',
    enterprise: 'Bright Foods',
    program: 'SETUP',
    manager: 'Maria Santos',
    progress: 78,
    status: 'Active',
    compliance: 'Compliant',
    dueDate: 'Jul 5, 2026',
    budget: 1250000,
    used: 980000,
  },
  {
    id: 'P-211',
    title: 'Cold Storage',
    enterprise: 'GreenHarvest',
    program: 'SETUP',
    manager: 'Joel Ramirez',
    progress: 99,
    status: 'At risk',
    compliance: 'Overdue',
    dueDate: 'Jun 30, 2026',
    budget: 950000,
    used: 940000,
  },
  {
    id: 'P-208',
    title: 'Coffee Roaster',
    enterprise: 'Highland Coffee',
    program: 'SETUP',
    manager: 'Ana Reyes',
    progress: 61,
    status: 'Active',
    compliance: 'Due soon',
    dueDate: 'Aug 14, 2026',
    budget: 680000,
    used: 412000,
  },
  {
    id: 'P-203',
    title: 'CNC Mill',
    enterprise: 'CarpenTech',
    program: 'SETUP',
    manager: 'Ana Reyes',
    progress: 100,
    status: 'Completed',
    compliance: 'Compliant',
    dueDate: 'May 30, 2026',
    budget: 2100000,
    used: 2070000,
  },
  {
    id: 'P-198',
    title: 'Water Quality Monitoring',
    enterprise: 'DOrSU Research Center',
    program: 'GIA',
    manager: 'Dr. Kevin Lim',
    progress: 44,
    status: 'Active',
    compliance: 'Due soon',
    dueDate: 'Sep 12, 2026',
    budget: 2180000,
    used: 960000,
    gia: {
      actualAccomplishment:
        'Installed six community sampling stations and completed baseline testing in four priority barangays. The first validation dataset is under technical review.',
      agency: 'Davao Oriental State University',
      baseStation: 'DOrSU Research and Extension Center, Mati City',
      catchUpPlan: 'Not required. Activities remain within the approved work plan.',
      cooperatingAgencies: [
        'Provincial Government of Davao Oriental',
        'Municipality of Baganga',
      ],
      durationMonths: 24,
      endDate: 'Jan 14, 2028',
      issueSummary: 'No critical issue reported.',
      latestReport: {
        period: 'January-June 2026',
        status: 'Approved',
        submitted: 'Jul 18, 2026',
      },
      location: 'Baganga, Davao Oriental, Region XI',
      objective:
        'Establish a community-operated water quality monitoring system and produce validated data for local environmental decisions.',
      outputs: [
        {
          actual: 1,
          category: 'Publications',
          description: 'Baseline methods paper in preparation.',
          target: 2,
        },
        {
          actual: 0,
          category: 'Patents / IP',
          description: 'No IP output due in the current period.',
          target: 1,
        },
        {
          actual: 1,
          category: 'Products',
          description: 'Field data collection toolkit deployed.',
          target: 3,
        },
        {
          actual: 64,
          category: 'People Services',
          description: 'Community monitors trained and supported.',
          target: 120,
        },
        {
          actual: 2,
          category: 'Places & Partnerships',
          description: 'Two LGU implementation partnerships active.',
          target: 4,
        },
        {
          actual: 0,
          category: 'Policy',
          description: 'Drafting begins after dataset validation.',
          target: 1,
        },
      ],
      reportingPeriod: 'Annual 2026',
      startDate: 'Jan 15, 2026',
      suggestedSolution:
        'Continue monthly data-quality checks and validate the remaining sampling sites before the next milestone.',
      targetProgress: 40,
      yearlyBudgets: [
        { amount: 1090000, label: 'Year 1' },
        { amount: 1090000, label: 'Year 2' },
      ],
    },
  },
  {
    id: 'P-192',
    title: 'Bamboo Product Development',
    enterprise: 'Cateel Bamboo Association',
    program: 'GIA',
    manager: 'Maria Torres',
    progress: 36,
    status: 'At risk',
    compliance: 'Due soon',
    dueDate: 'Oct 18, 2026',
    budget: 920000,
    used: 331000,
    gia: {
      actualAccomplishment:
        'Completed product-design workshops and three initial prototypes. Equipment commissioning is pending delivery of specialized cutting components.',
      agency: 'Cateel Bamboo Producers Association',
      baseStation: 'Municipal Livelihood Center, Cateel',
      catchUpPlan:
        'Complete parallel skills training while replacement components are in transit, then add two supervised fabrication runs in October.',
      cooperatingAgencies: [
        'Municipality of Cateel',
        'Davao Oriental State University',
      ],
      durationMonths: 12,
      endDate: 'Feb 28, 2027',
      issueSummary: 'Equipment delivery is delaying prototype validation.',
      latestReport: {
        period: 'January-June 2026',
        status: 'Under review',
        submitted: 'Jul 29, 2026',
      },
      location: 'Cateel, Davao Oriental, Region XI',
      objective:
        'Develop market-ready bamboo products and improve the association members\' design, fabrication, and quality-control capability.',
      outputs: [
        {
          actual: 0,
          category: 'Publications',
          description: 'Production guide scheduled for final quarter.',
          target: 1,
        },
        {
          actual: 0,
          category: 'Patents / IP',
          description: 'Design registration follows prototype validation.',
          target: 1,
        },
        {
          actual: 3,
          category: 'Products',
          description: 'Three prototype furniture products completed.',
          target: 8,
        },
        {
          actual: 28,
          category: 'People Services',
          description: 'Association members completed design workshops.',
          target: 50,
        },
        {
          actual: 2,
          category: 'Places & Partnerships',
          description: 'LGU and university partnerships active.',
          target: 3,
        },
        {
          actual: 0,
          category: 'Policy',
          description: 'No policy output committed for this project.',
          target: 0,
        },
      ],
      reportingPeriod: 'Annual 2026',
      startDate: 'Mar 1, 2026',
      suggestedSolution:
        'Expedite the supplier replacement and document the revised commissioning date for approval during the next monitoring review.',
      targetProgress: 50,
      yearlyBudgets: [{ amount: 920000, label: 'Year 1' }],
    },
  },
  {
    id: 'P-187',
    title: 'Fruit Drying Facility',
    enterprise: 'Tarragona Fruit Growers',
    program: 'SETUP',
    manager: 'Joel Ramirez',
    progress: 52,
    status: 'Active',
    compliance: 'Due soon',
    dueDate: 'Aug 28, 2026',
    budget: 1180000,
    used: 614000,
  },
]

export const transactions = [
  {
    id: 'TX-411',
    projectId: 'P-214',
    description: 'Equipment downpayment',
    date: 'Jun 22',
    amount: 450000,
  },
  {
    id: 'TX-410',
    projectId: 'P-211',
    description: 'Installation milestone 2',
    date: 'Jun 20',
    amount: 180000,
  },
  {
    id: 'TX-408',
    projectId: 'P-208',
    description: 'Materials reimbursement',
    date: 'Jun 18',
    amount: 62000,
  },
  {
    id: 'TX-405',
    projectId: 'P-198',
    description: 'Initial release',
    date: 'Jun 15',
    amount: 320000,
  },
]

export const equipmentRecords: EquipmentRecord[] = [
  {
    id: 'EQ-0261',
    name: 'Vacuum Packaging Machine',
    projectId: 'P-214',
    assignedTo: 'Bright Foods',
    location: 'Mati City',
    condition: 'Good',
    status: 'Issued',
    lastScanned: 'Jun 25, 9:42 AM',
  },
  {
    id: 'EQ-0254',
    name: 'Modular Cold Storage Unit',
    projectId: 'P-211',
    assignedTo: 'GreenHarvest',
    location: 'Banaybanay',
    condition: 'Fair',
    status: 'Issued',
    lastScanned: 'Jun 20, 2:18 PM',
  },
  {
    id: 'EQ-0248',
    name: 'Coffee Roasting Machine',
    projectId: 'P-208',
    assignedTo: 'Highland Coffee',
    location: 'Manay',
    condition: 'Good',
    status: 'Issued',
    lastScanned: 'Jun 24, 11:03 AM',
  },
  {
    id: 'EQ-0239',
    name: 'CNC Milling Machine',
    projectId: 'P-203',
    assignedTo: 'CarpenTech',
    location: 'Lupon',
    condition: 'Poor',
    status: 'Returned',
    lastScanned: 'Jun 12, 4:20 PM',
  },
  {
    id: 'EQ-0268',
    name: 'Portable Water Testing Kit',
    projectId: 'P-198',
    assignedTo: 'DOrSU Research Center',
    location: 'DOST Storage',
    condition: 'Good',
    status: 'In storage',
    lastScanned: 'Jun 26, 8:30 AM',
  },
]

export const reportCatalog = [
  {
    id: 'financial',
    title: 'Financial Utilization Report',
    description: 'Allocations, disbursements, balances, and billing compliance.',
    category: 'Financial',
  },
  {
    id: 'msme',
    title: 'MSME Performance Report',
    description: 'Sales, employment, production, and enterprise growth indicators.',
    category: 'Performance',
  },
  {
    id: 'accomplishment',
    title: 'Project Accomplishment Report',
    description: 'Milestones, outputs, delays, and completion rates.',
    category: 'Monitoring',
  },
  {
    id: 'inventory',
    title: 'Equipment Accountability Report',
    description: 'Asset issuance, condition, location, and return history.',
    category: 'Inventory',
  },
]

export const generatedReports = [
  {
    id: 'RPT-118',
    title: 'Q2 SETUP Financial Utilization',
    generated: 'Jun 24, 2026',
    format: 'PDF',
    owner: 'Admin Reyes',
  },
  {
    id: 'RPT-117',
    title: 'May Equipment Accountability',
    generated: 'Jun 3, 2026',
    format: 'PDF',
    owner: 'Admin Reyes',
  },
  {
    id: 'RPT-116',
    title: '2026 MSME Performance Summary',
    generated: 'May 31, 2026',
    format: 'XLSX',
    owner: 'Maria Santos',
  },
]

export const predictions: PredictionRecord[] = [
  {
    projectId: 'P-214',
    enterprise: 'Bright Foods',
    growth: 'Expanding',
    sustainability: 'Sustainable',
    recommendation: 'Renewal recommended',
    riskScore: 18,
  },
  {
    projectId: 'P-208',
    enterprise: 'Highland Coffee',
    growth: 'Stable',
    sustainability: 'Moderately sustainable',
    recommendation: 'Renewal recommended',
    riskScore: 34,
  },
  {
    projectId: 'P-211',
    enterprise: 'GreenHarvest',
    growth: 'Declining',
    sustainability: 'Unsustainable',
    recommendation: 'At risk',
    riskScore: 82,
  },
  {
    projectId: 'P-203',
    enterprise: 'CarpenTech',
    growth: 'Stable',
    sustainability: 'Moderately sustainable',
    recommendation: 'Needs intervention',
    riskScore: 57,
  },
  {
    projectId: 'P-187',
    enterprise: 'Tarragona Fruit Growers',
    growth: 'Stable',
    sustainability: 'Moderately sustainable',
    recommendation: 'Needs intervention',
    riskScore: 49,
  },
]

export const featureImportance = [
  { label: 'Budget utilization', value: 86 },
  { label: 'Report timeliness', value: 74 },
  { label: 'Revenue growth', value: 68 },
  { label: 'Equipment utilization', value: 61 },
  { label: 'Employment generation', value: 48 },
]

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function getProposalReviewStatus(
  proposal: ProposalRecord,
): ProposalReviewStatus {
  if (proposal.status === 'Approved') return 'Approved'
  if (proposal.status === 'Rejected') return 'Disapproved'

  const stageStatus: Record<ProposalRecord['stage'], ProposalReviewStatus> = {
    0: 'Submitted',
    1: 'Document Validation',
    2: 'Technical Review',
    3: 'Finance Review',
    4: 'Executive Approval',
  }

  return stageStatus[proposal.stage]
}

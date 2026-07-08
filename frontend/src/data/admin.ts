export type Program = 'GIA' | 'SETUP'

export interface ProposalRecord {
  amount: number
  completeness: number
  id: string
  organization: string
  program: Program
  reviewer: string
  stage: 0 | 1 | 2 | 3 | 4
  status: 'Pending' | 'Under review' | 'Approved' | 'Rejected'
  submitted: string
  title: string
}

export type ProposalReviewStatus =
  | 'Submitted'
  | 'Document Validation'
  | 'Technical Review'
  | 'Finance Review'
  | 'Executive Approval'
  | 'Approved'
  | 'Disapproved'

export interface ProjectRecord {
  budget: number
  compliance: 'Compliant' | 'Due soon' | 'Overdue'
  dueDate: string
  enterprise: string
  id: string
  manager: string
  program: Program
  progress: number
  status: 'Active' | 'At risk' | 'Completed'
  title: string
  used: number
}

export interface EquipmentRecord {
  assignedTo: string
  condition: 'Good' | 'Needs inspection' | 'For repair'
  id: string
  lastScanned: string
  location: string
  name: string
  projectId: string
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
    organization: 'GreenHarvest Producers',
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
    organization: 'Mariner Seafoods',
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
    organization: 'Mati Woodcraft',
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
    organization: 'Tarragona Fruit Growers',
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
    organization: 'LGU San Isidro',
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
    manager: 'Kevin Lim',
    progress: 44,
    status: 'Active',
    compliance: 'Due soon',
    dueDate: 'Sep 12, 2026',
    budget: 2180000,
    used: 960000,
  },
  {
    id: 'P-192',
    title: 'Bamboo Product Development',
    enterprise: 'Cateel Bamboo Association',
    program: 'GIA',
    manager: 'Kevin Lim',
    progress: 36,
    status: 'Active',
    compliance: 'Compliant',
    dueDate: 'Oct 18, 2026',
    budget: 920000,
    used: 331000,
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
    condition: 'Needs inspection',
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
    condition: 'For repair',
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

import type {
  ProposalDocumentKey,
  ProposalFormData,
  ProposalType,
} from '../types/proposal'

export interface SelectOption {
  label: string
  value: string
}

export interface DocumentRequirement {
  accept: string
  description: string
  key: ProposalDocumentKey
  label: string
  required: boolean
}

export const initialProposalFormData: ProposalFormData = {
  applicantFullName: '',
  applicantPosition: '',
  emailAddress: '',
  contactNumber: '',
  organizationName: '',
  organizationType: '',
  industryCategory: '',
  yearEstablished: '',
  employeeCount: '',
  municipality: '',
  businessAddress: '',
  proposalType: '',
  projectTitle: '',
  projectCategory: '',
  projectType: '',
  technologyInnovation: '',
  targetBeneficiary: '',
  equipmentNeeds: '',
  totalBusinessAssets: '',
  annualNetProfit: '',
  documents: {
    registrationCertificate: null,
    businessPermit: null,
    birCertificate: null,
    projectProposal: null,
    lineItemBudget: null,
    proponentBiodata: null,
    incomeTaxReturn: null,
    equipmentQuotations: null,
  },
  certified: false,
}

export const proposalTypeOptions: SelectOption[] = [
  {
    value: 'GIA',
    label: 'GIA - Grants-in-Aid Program',
  },
  {
    value: 'SETUP',
    label: 'SETUP - Small Enterprise Technology Upgrading Program',
  },
]

export const projectCategoryOptions: SelectOption[] = [
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Food Processing', label: 'Food Processing' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'ICT / Software', label: 'ICT / Software' },
  { value: 'Health', label: 'Health' },
  { value: 'Education', label: 'Education' },
  { value: 'Environment', label: 'Environment' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Fisheries', label: 'Fisheries' },
  { value: 'Others', label: 'Others' },
]

export const projectTypeOptions: SelectOption[] = [
  { value: 'Research and Development', label: 'Research and Development' },
  { value: 'Technology Transfer', label: 'Technology Transfer' },
  { value: 'Equipment Assistance', label: 'Equipment Assistance' },
  { value: 'Capability Building', label: 'Capability Building' },
  { value: 'Innovation Project', label: 'Innovation Project' },
  { value: 'Others', label: 'Others' },
]

export const targetBeneficiaryOptions: SelectOption[] = [
  { value: 'MSMEs', label: 'MSMEs' },
  { value: 'Farmers', label: 'Farmers' },
  { value: 'Fisherfolk', label: 'Fisherfolk' },
  { value: 'Cooperatives', label: 'Cooperatives' },
  {
    value: 'Local Government Units (LGUs)',
    label: 'Local Government Units (LGUs)',
  },
  { value: 'Community Organizations', label: 'Community Organizations' },
  { value: 'Students', label: 'Students' },
  { value: 'Others', label: 'Others' },
]

export const organizationTypeOptions: SelectOption[] = [
  { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'Cooperative', label: 'Cooperative' },
  { value: 'Nonprofit Organization', label: 'Nonprofit Organization' },
  { value: 'Local Government Unit', label: 'Local Government Unit' },
  { value: 'State University or College', label: 'State University or College' },
]

export const industryCategoryOptions: SelectOption[] = [
  { value: 'Agriculture and Aquaculture', label: 'Agriculture and Aquaculture' },
  { value: 'Food Processing', label: 'Food Processing' },
  { value: 'Furniture and Wood Products', label: 'Furniture and Wood Products' },
  { value: 'Gifts, Decor, and Handicrafts', label: 'Gifts, Decor, and Handicrafts' },
  { value: 'Information Technology', label: 'Information Technology' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Metals and Engineering', label: 'Metals and Engineering' },
  { value: 'Health and Wellness', label: 'Health and Wellness' },
  { value: 'Other', label: 'Other' },
]

export const municipalityOptions: SelectOption[] = [
  { value: 'Baganga', label: 'Baganga' },
  { value: 'Banaybanay', label: 'Banaybanay' },
  { value: 'Boston', label: 'Boston' },
  { value: 'Caraga', label: 'Caraga' },
  { value: 'Cateel', label: 'Cateel' },
  { value: 'City of Mati', label: 'City of Mati' },
  { value: 'Governor Generoso', label: 'Governor Generoso' },
  { value: 'Lupon', label: 'Lupon' },
  { value: 'Manay', label: 'Manay' },
  { value: 'San Isidro', label: 'San Isidro' },
  { value: 'Tarragona', label: 'Tarragona' },
]

export function getDocumentRequirements(proposalType: ProposalType): DocumentRequirement[] {
  const isSetup = proposalType === 'SETUP'

  return [
    {
      key: 'registrationCertificate',
      label: 'DTI / SEC / CDA Registration',
      description: 'Valid registration document issued by the applicable government agency.',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
    {
      key: 'businessPermit',
      label: "Mayor's / Business Permit",
      description: 'Current permit for enterprises applying through SETUP.',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: isSetup,
    },
    {
      key: 'birCertificate',
      label: 'BIR Certificate of Registration',
      description: 'Latest BIR registration certificate for SETUP applicants.',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: isSetup,
    },
    {
      key: 'projectProposal',
      label: 'Project Proposal (Narrative)',
      description: 'Complete narrative with objectives, activities, and expected results.',
      accept: '.pdf,.doc,.docx',
      required: true,
    },
    {
      key: 'lineItemBudget',
      label: 'Line-Item Budget (LIB)',
      description: 'Detailed cost breakdown matching the requested project amount.',
      accept: '.pdf,.xls,.xlsx',
      required: true,
    },
    {
      key: 'proponentBiodata',
      label: 'Bio-data of Proponent',
      description: 'Current profile or curriculum vitae of the authorized proponent.',
      accept: '.pdf,.doc,.docx',
      required: true,
    },
    {
      key: 'incomeTaxReturn',
      label: 'Income Tax Return (latest)',
      description: 'Latest filed income tax return for SETUP applicants.',
      accept: '.pdf',
      required: isSetup,
    },
    {
      key: 'equipmentQuotations',
      label: 'Quotations of Equipment',
      description: 'Supplier quotations for equipment included in the proposal budget.',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: isSetup,
    },
  ]
}

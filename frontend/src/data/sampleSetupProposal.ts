import type { ApplicationRecord } from '../types/application'
import type { SetupProposalData } from '../types/setupProposal'

export const SAMPLE_SETUP_REFERENCE = 'SETUP-SAMPLE-001'

export const sampleSetupApplication: ApplicationRecord = {
  applicantName: 'Maria L. Santos',
  contactEmail: 'proponent@dost.gov.ph',
  createdAt: '2026-07-15T09:30:00.000Z',
  id: 'sample-setup-proposal',
  organizationName: 'Mati Cacao Producers Cooperative',
  program: 'SETUP',
  projectTitle: 'Upgrading Cacao Processing Through Automated Roasting and Grinding Technology',
  referenceNo: SAMPLE_SETUP_REFERENCE,
  status: 'Draft Submitted',
}

export const sampleSetupProposal: SetupProposalData = {
  projectTitle: 'Upgrading Cacao Processing Through Automated Roasting and Grinding Technology',
  generalObjective: 'Improve the cooperative’s cacao processing capacity, product consistency, and market competitiveness through appropriate food-processing technology.',
  specificObjectives: 'Increase monthly production capacity; standardize roasting and grinding; reduce processing time and product losses; and improve the quality of locally produced tablea and cacao products.',
  projectBackground: 'The cooperative currently processes cacao using small manual equipment. Growing demand from retailers and institutional buyers has created production delays and inconsistent roasting results. The proposed technology upgrade will help the enterprise produce safer, more consistent, and market-ready cacao products.',
  businessName: 'Mati Cacao Producers Cooperative',
  businessAddress: 'Barangay Dahican, City of Mati, Davao Oriental',
  contactPerson: 'Maria L. Santos',
  contactNumber: '0917 123 4567',
  emailAddress: 'proponent@dost.gov.ph',
  yearEstablished: '2018',
  organizationType: 'Cooperative',
  businessSize: 'Small',
  numberOfEmployees: '18',
  businessIndustry: 'Food Processing',
  productsServices: 'Premium tablea, roasted cacao nibs, cacao powder, and cacao-based beverage mixes.',
  enterpriseBackground: 'A farmer-led cooperative that consolidates cacao beans from member farms and produces value-added cacao products for local retailers, tourism establishments, and institutional buyers in Davao Region.',
  organizationalStructure: 'General Assembly, Board of Directors, General Manager, Production Team, Quality Control, Marketing, and Finance.',
  ownerKeyPersonnel: 'Maria L. Santos — Chairperson; Joel D. Rivera — General Manager; Ana P. Flores — Production Supervisor.',
  skillsExpertise: 'Cacao fermentation and drying, food processing, cooperative management, quality control, and local market development.',
  plantLocation: 'Barangay Dahican, City of Mati, Davao Oriental',
  rawMaterials: 'Fermented and dried cacao beans sourced primarily from cooperative members in Mati and neighboring municipalities.',
  currentProductionProcess: 'Manual sorting, small-batch roasting, hand cracking and winnowing, grinding, molding, cooling, and manual packing.',
  existingProblems: 'Uneven roasting, limited grinding capacity, long processing time, inconsistent product texture, and difficulty meeting larger orders.',
  proposedTechnologyIntervention: 'Food-grade cacao roaster, cacao bean cracker and winnower, and stainless-steel cacao grinder with operator training and process standardization.',
  expectedOutputs: 'Higher production capacity, consistent roast profiles, shorter processing time, reduced losses, improved product quality, and increased sales opportunities.',
  targetMarket: 'Retail stores, pasalubong centers, hotels, cafés, institutional buyers, and online consumers in Davao Region.',
  competitors: 'Local tablea processors and commercial cacao beverage brands operating in Mindanao.',
  marketingStrategy: 'Regional trade fairs, retailer partnerships, product sampling, social media promotion, and improved packaging and labeling.',
  distributionChannel: 'Direct selling, retail partners, institutional orders, cooperative outlets, and online delivery.',
  annualSales: '2400000',
  existingFundingSource: 'Cooperative equity and retained earnings',
}

export function isSampleSetupApplication(referenceNo: string) {
  return referenceNo === SAMPLE_SETUP_REFERENCE
}

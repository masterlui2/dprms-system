/**
 * System: DPRMS
 * Purpose: Proposal definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ProposalDocumentKey, ProposalFormData, ProposalType } from '../types/proposal';

export interface SelectOption
{
    label: string;
    value: string;
}

export interface DocumentRequirement
{
    accept: string;
    appliesTo?: string;
    description: string;
    key: ProposalDocumentKey;
    label: string;
    required: boolean;
    validationMessage: string;
}

export const INITIAL_PROPOSAL_FORM_DATA: ProposalFormData = {
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
    cooperatingAgency: '',
    headOfAgency: '',
    authorizedRepresentative: '',
    lineOfBusiness: '',
    businessType: '',
    enterpriseSize: '',
    proposalType: '',
    projectTitle: '',
    scopeOfAssistance: '',
    currentOperationalProblem: '',
    existingEquipmentUsed: '',
    processBottlenecks: '',
    productQualityConcerns: '',
    productivityConcerns: '',
    targetImprovement: '',
    projectCategory: '',
    projectType: '',
    tnaStatus: '',
    projectDescription: '',
    projectObjectives: '',
    rationale: '',
    methodology: '',
    personnelInvolved: '',
    proposedTechnologyAssistance: '',
    siteOfImplementation: '',
    technologyInnovation: '',
    targetBeneficiary: '',
    expectedOutputs: '',
    sustainabilityPlan: '',
    workplanSummary: '',
    equipmentNeeds: '',
    equipmentPurpose: '',
    supplierFabricator: '',
    totalBusinessAssets: '',
    annualNetProfit: '',
    documents: {
        letterOfIntent: null,
        endorsementLetter: null,
        eligibilityChecklist: null,
        workplan: null,
        rtecReport: null,
        setiScorecard: null,
        gadChecklist: null,
        moaResolution: null,
        certificateOfFundsAvailability: null,
        chedAccreditation: null,
        dostTrackRecord: null,
        secCdaDoleRegistration: null,
        auditedFinancialStatements: null,
        swornAffidavit: null,
        secretaryCertificate: null,
        boardResolution: null,
        tnaForm01: null,
        mayorsPermit: null,
        dtiRegistration: null,
        notarizedBoardResolution: null,
        registrationCertificate: null,
        businessPermit: null,
        birCertificate: null,
        projectProposal: null,
        incomeTaxReturn: null,
        supportingDocuments: null,
        setupProposal: null,
        businessProfile: null,
    },
    certified: false,
};

export const PROPOSAL_TYPE_OPTIONS: SelectOption[] = [
    {
        value: 'GIA',
        label: 'GIA - Grants-in-Aid Program',
    },
    {
        value: 'SETUP',
        label: 'SETUP - Small Enterprise Technology Upgrading Program',
    },
];

export const PROJECT_CATEGORY_OPTIONS: SelectOption[] = [
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
];

export const GIA_PROJECT_TYPE_OPTIONS: SelectOption[] = [
    { value: 'Applied Research', label: 'Applied Research' },
    { value: 'Basic Research', label: 'Basic Research' },
    { value: 'Development Research', label: 'Development Research' },
];

export const TNA_STATUS_OPTIONS: SelectOption[] = [
    { value: 'Not yet conducted', label: 'Not yet conducted' },
    { value: 'Conducted by PSTO', label: 'Conducted by PSTO' },
];

export const SETUP_PROJECT_TYPE_OPTIONS: SelectOption[] = [
    { value: 'Equipment Upgrading', label: 'Equipment Upgrading' },
    { value: 'Process Improvement', label: 'Process Improvement' },
    { value: 'Product Development', label: 'Product Development' },
    { value: 'Packaging and Labeling', label: 'Packaging and Labeling' },
    { value: 'Productivity Improvement', label: 'Productivity Improvement' },
    { value: 'Others', label: 'Others' },
];

export const GIA_TARGET_BENEFICIARY_OPTIONS: SelectOption[] = [
    { value: 'Community Organization', label: 'Community Organization' },
    { value: 'Farmers', label: 'Farmers' },
    { value: 'Fisherfolk', label: 'Fisherfolk' },
    { value: 'Cooperatives', label: 'Cooperatives' },
    { value: 'LGU', label: 'LGU' },
    { value: 'Students', label: 'Students' },
    { value: 'Others', label: 'Others' },
];

export const GIA_COOPERATING_AGENCY_OPTIONS: SelectOption[] = [
    { value: 'Not applicable', label: 'Not applicable' },
    { value: 'LGU', label: 'LGU' },
    { value: 'NGO / CSO', label: 'NGO / CSO' },
    {
        value: 'Higher Education Institution',
        label: 'Higher Education Institution',
    },
    { value: 'Private Sector', label: 'Private Sector' },
    { value: 'Other', label: 'Other' },
];

export const SETUP_TARGET_BENEFICIARY_OPTIONS: SelectOption[] = [
    { value: 'Micro', label: 'Micro Enterprise' },
    { value: 'Small', label: 'Small Enterprise' },
    { value: 'Medium', label: 'Medium Enterprise' },
];

export const ORGANIZATION_TYPE_OPTIONS: SelectOption[] = [
    { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
    { value: 'Partnership', label: 'Partnership' },
    { value: 'Corporation', label: 'Corporation' },
    { value: 'Cooperative', label: 'Cooperative' },
    { value: 'Nonprofit Organization', label: 'Nonprofit Organization' },
    { value: 'Local Government Unit', label: 'Local Government Unit' },
    {
        value: 'State University or College',
        label: 'State University or College',
    },
];

export const INDUSTRY_CATEGORY_OPTIONS: SelectOption[] = [
    {
        value: 'Agriculture and Aquaculture',
        label: 'Agriculture and Aquaculture',
    },
    { value: 'Food Processing', label: 'Food Processing' },
    {
        value: 'Furniture and Wood Products',
        label: 'Furniture and Wood Products',
    },
    {
        value: 'Gifts, Decor, and Handicrafts',
        label: 'Gifts, Decor, and Handicrafts',
    },
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Metals and Engineering', label: 'Metals and Engineering' },
    { value: 'Health and Wellness', label: 'Health and Wellness' },
    { value: 'Other', label: 'Other' },
];

export const MUNICIPALITY_OPTIONS: SelectOption[] = [
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
];

const ACCEPTED_DOCUMENT_FORMATS = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png';

export const GIA_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
    {
        key: 'letterOfIntent',
        label: 'Letter of Intent / Collaboration',
        appliesTo: 'General GIA',
        description: 'Letter signed by the Head of Implementing Agency.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the Letter of Intent or Collaboration.',
    },
    {
        key: 'eligibilityChecklist',
        label: 'Project Leader Eligibility Checklist',
        appliesTo: 'General GIA',
        description: 'Accomplished eligibility checklist for the project leader.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the eligibility checklist.',
    },
    {
        key: 'projectProposal',
        label: 'Complete Project Proposal',
        appliesTo: 'General GIA',
        description: 'Complete project proposal matching the selected project type.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload your Project Proposal.',
    },
    {
        key: 'workplan',
        label: 'Workplan',
        appliesTo: 'General GIA',
        description: 'Project workplan and implementation schedule.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the workplan.',
    },
    {
        key: 'moaResolution',
        label: 'MOA with Resolution to Sign',
        appliesTo: 'LGU / NGO',
        description: 'Required for LGU / NGO proponents.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload the MOA or resolution to sign.',
    },
    {
        key: 'certificateOfFundsAvailability',
        label: 'Certificate of Funds Availability',
        appliesTo: 'General GIA',
        description: 'Certification of available counterpart or project funds.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the Certificate of Funds Availability.',
    },
    {
        key: 'chedAccreditation',
        label: 'CHED Accreditation',
        appliesTo: 'Higher Education Institutions',
        description: 'Additional requirement for Higher Education Institutions.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload the CHED Accreditation.',
    },
    {
        key: 'secCdaDoleRegistration',
        label: 'SEC / CDA / DOLE Registration and By-Laws',
        appliesTo: 'NGO / CSO / Private Sector',
        description: 'Registration and Articles of Incorporation / Cooperation with By-Laws.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload registration documents and by-laws.',
    },
    {
        key: 'auditedFinancialStatements',
        label: 'Audited Financial Statements',
        appliesTo: 'NGO / CSO / Private Sector',
        description: 'Audited financial statements for the past three years.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload audited financial statements.',
    },
    {
        key: 'swornAffidavit',
        label: 'Sworn Affidavit of No Relationship',
        appliesTo: 'NGO / CSO / Private Sector',
        description: 'Sworn affidavit declaring no relationship.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload the sworn affidavit.',
    },
    {
        key: 'secretaryCertificate',
        label: "Secretary's Certificate",
        appliesTo: 'NGO / CSO / Private Sector',
        description: 'Certificate of directors and officers.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: "Please upload the Secretary's Certificate.",
    },
    {
        key: 'boardResolution',
        label: 'Board Resolution',
        appliesTo: 'NGO / CSO / Private Sector',
        description:
            'Engagement, official representative, and authority to transact with DOST Davao Region.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload the Board Resolution.',
    },
];

export const SETUP_BUSINESS_TYPE_OPTIONS: SelectOption[] = [
    { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
    { value: 'Partnership', label: 'Partnership' },
    { value: 'Corporation', label: 'Corporation' },
    { value: 'Cooperative', label: 'Cooperative' },
];

export const LINE_OF_BUSINESS_OPTIONS: SelectOption[] = [
    { value: 'Food Processing', label: 'Food Processing' },
    { value: 'Agriculture / Aquaculture', label: 'Agriculture / Aquaculture' },
    {
        value: 'Furniture and Wood Products',
        label: 'Furniture and Wood Products',
    },
    {
        value: 'Gifts, Decor, and Handicrafts',
        label: 'Gifts, Decor, and Handicrafts',
    },
    { value: 'Metals and Engineering', label: 'Metals and Engineering' },
    { value: 'Health and Wellness', label: 'Health and Wellness' },
    { value: 'ICT / Software', label: 'ICT / Software' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Other', label: 'Other' },
];

export const SETUP_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
    {
        key: 'letterOfIntent',
        label: 'Letter of Intent',
        appliesTo: 'SETUP',
        description: 'Interest in SETUP and commitment to refund the assistance.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the Letter of Intent.',
    },
    {
        key: 'setupProposal',
        label: 'Comprehensive Project Proposal',
        appliesTo: 'SETUP',
        description: 'Proposal with scope, objectives, and expected outcomes.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the comprehensive project proposal.',
    },
    {
        key: 'mayorsPermit',
        label: "Recent Business / Mayor's Permit",
        appliesTo: 'SETUP',
        description: "Permit showing the firm's line of business.",
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: "Please upload the Business / Mayor's Permit.",
    },
    {
        key: 'dtiRegistration',
        label: 'DTI Registration',
        appliesTo: 'Sole Proprietorship',
        description: 'Required for sole proprietorship.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload the DTI Registration.',
    },
    {
        key: 'birCertificate',
        label: 'BIR Registration',
        appliesTo: 'SETUP',
        description: 'Business tax registration.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload the BIR Registration.',
    },
    {
        key: 'notarizedBoardResolution',
        label: 'Notarized Board Resolution',
        appliesTo: 'Corporation / Cooperative',
        description:
            'Participation and official signatory authorization for corporations or cooperatives.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: false,
        validationMessage: 'Please upload the notarized Board Resolution.',
    },
    {
        key: 'auditedFinancialStatements',
        label: 'Audited Financial Statements',
        appliesTo: 'Small / Medium / Micro Enterprise',
        description:
            'Past three years for small/medium enterprises, or at least one year for micro enterprises.',
        accept: ACCEPTED_DOCUMENT_FORMATS,
        required: true,
        validationMessage: 'Please upload audited financial statements.',
    },
];

/** Get document requirements. */
export function getDocumentRequirements(strProposalType: ProposalType): DocumentRequirement[]
{
    if (strProposalType === 'GIA')
    {
        return GIA_DOCUMENT_REQUIREMENTS;
    }
    if (strProposalType === 'SETUP')
    {
        return SETUP_DOCUMENT_REQUIREMENTS;
    }
    return [];
}

/** Is gia conditional requirement visible. */
function _isGiaConditionalRequirementVisible(
    objRequirement: DocumentRequirement,
    objData: ProposalFormData,
)
{
    if (objRequirement.required)
    {
        return true;
    }

    const strAgencyType = objData.cooperatingAgency || objData.organizationType;

    if (strAgencyType === 'LGU' || strAgencyType === 'Local Government Unit')
    {
        return objRequirement.appliesTo === 'LGU / NGO';
    }

    if (strAgencyType === 'NGO / CSO' || strAgencyType === 'Nonprofit Organization')
    {
        return (
            objRequirement.appliesTo === 'LGU / NGO' ||
            objRequirement.appliesTo === 'NGO / CSO / Private Sector'
        );
    }

    if (
        strAgencyType === 'Higher Education Institution' ||
        strAgencyType === 'State University or College'
    )
    {
        return objRequirement.appliesTo === 'Higher Education Institutions';
    }

    if (
        strAgencyType === 'Private Sector' ||
        strAgencyType === 'Sole Proprietorship' ||
        strAgencyType === 'Partnership' ||
        strAgencyType === 'Corporation' ||
        strAgencyType === 'Cooperative'
    )
    {
        return objRequirement.appliesTo === 'NGO / CSO / Private Sector';
    }

    return false;
} /* end _isGiaConditionalRequirementVisible */

/** Is setup conditional requirement visible. */
function _isSetupConditionalRequirementVisible(
    objRequirement: DocumentRequirement,
    objData: ProposalFormData,
)
{
    if (objRequirement.required)
    {
        return true;
    }

    if (objData.businessType === 'Sole Proprietorship')
    {
        return objRequirement.appliesTo === 'Sole Proprietorship';
    }

    if (objData.businessType === 'Corporation' || objData.businessType === 'Cooperative')
    {
        return objRequirement.appliesTo === 'Corporation / Cooperative';
    }

    return false;
}

/** Get visible document requirements. */
export function getVisibleDocumentRequirements(objData: ProposalFormData): DocumentRequirement[]
{
    const arrRequirements = getDocumentRequirements(objData.proposalType);

    if (objData.proposalType === 'GIA')
    {
        return arrRequirements.filter((objRequirement) =>
            _isGiaConditionalRequirementVisible(objRequirement, objData),
        );
    }

    if (objData.proposalType === 'SETUP')
    {
        return arrRequirements.filter((objRequirement) =>
            _isSetupConditionalRequirementVisible(objRequirement, objData),
        );
    }

    return [];
}

/** Is are required documents complete. */
export function isAreRequiredDocumentsComplete(objData: ProposalFormData): boolean
{
    const arrRequirements = getVisibleDocumentRequirements(objData);

    return (
        arrRequirements.length > 0 &&
        arrRequirements.every((objRequirement) => objData.documents[objRequirement.key])
    );
}

/**
 * System: DPRMS
 * Purpose: Gia proposal definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { GiaProponentCategory, GiaProposalData } from '../types/gia_proposal';

export const GIA_PROPONENT_CATEGORIES: Array<Exclude<GiaProponentCategory, ''>> = [
    'Private Sector',
    'Higher Education Institution',
    'Barangay LGU',
];

export const GIA_PROJECT_CATEGORIES = [
    'Agriculture and Fisheries',
    'Community Development',
    'Education',
    'Environment',
    'Health',
    'Information and Communications Technology',
    'Research and Development',
    'Disaster Risk Reduction and Management',
    'Others',
];

export const GIA_PROJECT_TYPES = [
    'Research and Development',
    'Capability Building and Training',
    'Technology Transfer',
    'Community-Based Science and Technology Project',
    'Others',
];

export const EMPTY_GIA_PROPOSAL: GiaProposalData = {
    proponentCategory: '',
    organizationName: '',
    officeAddress: '',
    projectLeader: '',
    position: '',
    contactNumber: '',
    emailAddress: '',
    projectTitle: '',
    projectCategory: '',
    projectType: '',
    projectSummary: '',
    projectRationale: '',
    generalObjective: '',
    specificObjectives: '',
    siteOfImplementation: '',
    targetBeneficiaries: '',
    methodology: '',
    expectedOutputs: '',
    sustainabilityPlan: '',
};

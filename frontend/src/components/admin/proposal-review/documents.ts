/**
 * System: DPRMS
 * Purpose: Documents definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { Program } from '../../../data/admin';
import type { SampleDocument } from './types';

const SETUP_DOCUMENTS: SampleDocument[] = [
    {
        title: 'SETUP Proposal',
        name: 'SETUP_Proposal_Bright_Foods.pdf',
        size: '2.4 MB',
        pages: 18,
        updated: 'Jun 24, 2026',
    },
    {
        title: 'Line-Item Budget',
        name: 'Line_Item_Budget.xlsx',
        size: '286 KB',
        pages: 4,
        updated: 'Jun 24, 2026',
    },
    {
        title: 'DTI / SEC Registration',
        name: 'Business_Registration.pdf',
        size: '840 KB',
        pages: 3,
        updated: 'Jun 23, 2026',
    },
    {
        title: 'Business Profile',
        name: 'Enterprise_Profile.pdf',
        size: '1.1 MB',
        pages: 7,
        updated: 'Jun 23, 2026',
    },
    {
        title: 'Equipment Quotations',
        name: 'Supplier_Quotations.pdf',
        size: '3.2 MB',
        pages: 12,
        updated: 'Jun 24, 2026',
    },
];

const GIA_DOCUMENTS: SampleDocument[] = [
    {
        title: 'Project Proposal',
        name: 'GIA_Project_Proposal.pdf',
        size: '3.1 MB',
        pages: 24,
        updated: 'Jun 23, 2026',
    },
    {
        title: 'Line-Item Budget',
        name: 'GIA_Line_Item_Budget.xlsx',
        size: '310 KB',
        pages: 5,
        updated: 'Jun 23, 2026',
    },
    {
        title: 'DTI / SEC / CDA Registration',
        name: 'Organization_Registration.pdf',
        size: '920 KB',
        pages: 4,
        updated: 'Jun 22, 2026',
    },
    {
        title: "Business / Mayor's Permit",
        name: 'Current_Mayors_Permit.pdf',
        size: '740 KB',
        pages: 2,
        updated: 'Jun 22, 2026',
    },
    {
        title: 'Supporting Documents',
        name: 'Technical_Supporting_Documents.pdf',
        size: '4.6 MB',
        pages: 16,
        updated: 'Jun 23, 2026',
    },
];

/** Get proposal documents. */
export function getProposalDocuments(strProgram: Program)
{
    return strProgram === 'SETUP' ? SETUP_DOCUMENTS : GIA_DOCUMENTS;
}

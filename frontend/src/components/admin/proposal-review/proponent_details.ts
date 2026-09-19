/**
 * System: DPRMS
 * Purpose: Proponent details definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ProposalRecord } from '../../../data/admin';

/** Get proponent details. */
export function getProponentDetails(objProposal: ProposalRecord)
{
    const strSlug = objProposal.organization
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/(^\.|\.$)/g, '');

    return {
        contactPerson: objProposal.program === 'GIA' ? 'Dr. Elena Marquez' : 'Maria Santos',
        designation:
            objProposal.program === 'GIA'
                ? 'Project Leader'
                : 'Enterprise Owner / Authorized Representative',
        email: `${strSlug || 'proponent'}@example.com`,
        mobile: objProposal.program === 'GIA' ? '+63 917 204 1188' : '+63 917 520 4412',
        organizationType:
            objProposal.program === 'GIA'
                ? 'Academic / Government Research Institution'
                : 'MSME / Cooperative',
        address: 'Davao Oriental',
    };
}

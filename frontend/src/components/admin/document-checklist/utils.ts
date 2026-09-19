/**
 * System: DPRMS
 * Purpose: Utils definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { DocumentChecklistItem } from '../../../services/document_checklist_store';
import { reportError } from '../../../utils/error_reporting';

/** Format file size. */
export function formatFileSize(intBytes?: number | null): string
{
    if (intBytes == null || intBytes <= 0)
    {
        return 'Unknown size';
    }
    if (intBytes < 1024)
    {
        return `${intBytes} B`;
    }
    if (intBytes < 1024 * 1024)
    {
        return `${(intBytes / 1024).toFixed(1)} KB`;
    }
    return `${(intBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format relative date. */
export function formatRelativeDate(strDateStr?: string | null): string
{
    if (!strDateStr)
    {
        return 'Recently';
    }
    try
    {
        const dtDate = new Date(strDateStr);
        const dtNow = new Date();
        const intDiffMs = dtNow.getTime() - dtDate.getTime();
        const intDiffDays = Math.floor(intDiffMs / (1000 * 60 * 60 * 24));
        if (intDiffDays === 0)
        {
            return 'Today';
        }
        if (intDiffDays === 1)
        {
            return 'Yesterday';
        }
        if (intDiffDays < 30)
        {
            return `${intDiffDays}d ago`;
        }
        return dtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (errCaught)
    {
        reportError(errCaught, 'utils: format relative date failed.');

        return 'Recently';
    }
} /* end formatRelativeDate */

/** Get item compliance state. */
export function getItemComplianceState(objItem: DocumentChecklistItem)
{
    const blnHasFile = Boolean(objItem.uploadedDoc);
    const blnIsReturned =
        blnHasFile &&
        (objItem.status === 'Needs Revision' ||
            objItem.uploadedDoc?.status === 'returned_for_revision');
    const blnIsApproved =
        objItem.status === 'Complied' &&
        (objItem.uploadedDoc?.status === 'approved' || !blnHasFile || Boolean(objItem.reviewedAt));

    if (blnIsReturned)
    {
        return {
            type: 'RETURNED' as const,
            label: 'Revision',
            badgeClass: 'text-rose-700',
            iconClass: 'bg-rose-500 text-white',
        };
    }

    if (blnIsApproved || (objItem.isPresent && !blnIsReturned))
    {
        return {
            type: 'SATISFIED' as const,
            label: 'Verified',
            badgeClass: 'text-emerald-700',
            iconClass: 'bg-emerald-500 text-white',
        };
    }

    if (blnHasFile)
    {
        return {
            type: 'UNDER_REVIEW' as const,
            label: 'In Review',
            badgeClass: 'text-[#0f53b7]',
            iconClass: 'bg-[#0f53b7] text-white',
        };
    }

    return {
        type: 'PENDING' as const,
        label: null,
        badgeClass: '',
        iconClass: 'bg-slate-100 text-slate-400',
    };
} /* end getItemComplianceState */

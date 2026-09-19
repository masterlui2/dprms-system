/**
 * System: DPRMS
 * Purpose: Types definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type {
    ChecklistTemplatePayload,
    DocumentChecklistItem,
} from '../../../services/document_checklist_store';

export type DocumentReviewStatus = 'APPROVED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING';

export type DocumentComplianceState = 'approved' | 'action_needed' | 'missing' | 'under_review';

export interface ChecklistStats
{
    total: number;
    approved: number;
    actionNeeded: number;
    missing: number;
    underReview: number;
    complianceRate: number;
}

export interface ChecklistCategoryItem
{
    id: string;
    stageOrSetTag: string;
    name: string;
    shortName: string;
    subtitle: string;
}

export type ChecklistCategory = 'all' | 'legal' | 'technical' | 'financial' | 'administrative';

export interface PreviewDocState
{
    item: DocumentChecklistItem;
    url: string;
    version?: number;
}

export interface TemplateFormData
{
    name: string;
    category: 'legal' | 'technical' | 'financial' | 'administrative';
    required: boolean;
    description: string;
}

export interface ArchiveToastState
{
    templateId: string;
    item: ChecklistTemplatePayload;
    timeoutId?: ReturnType<typeof setTimeout>;
}

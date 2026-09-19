/**
 * System: DPRMS
 * Purpose: Types definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
export type ReviewSection = 'overview' | 'documents' | 'internalDocuments' | 'comments';

export interface SampleDocument
{
    name: string;
    pages: number;
    size: string;
    title: string;
    updated: string;
}

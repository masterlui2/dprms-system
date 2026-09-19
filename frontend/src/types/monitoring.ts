/**
 * System: DPRMS
 * Purpose: Monitoring definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
export interface ProjectPagination
{
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number | null;
    to: number | null;
}

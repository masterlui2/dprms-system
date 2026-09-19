/**
 * System: DPRMS
 * Purpose: Describe the current equipment API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { Program } from '../../data/admin';

export type ApiCondition = 'good' | 'fair' | 'poor' | 'non-functional';

export interface EquipmentApiRecord
{
    acquisition_cost: number;
    acquisition_date: string | null;
    id: number;
    asset_reference: string;
    equipment_name: string;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
    condition: ApiCondition;
    status: string;
    last_checked_at: string | null;
    installed_at: string | null;
    program_type: Program;
    category: string | null;
    organization: string;
    location: string;
    property_number: string | null;
    supplier_name: string | null;
    specifications: string | null;
    unit: string | null;
    project: {
        id: number | null;
        reference_number: string | null;
        title: string | null;
        program_type: Program;
    };
    qr_code: {
        reference: string;
        data: string;
        is_active: boolean;
    } | null;
    inspection_history: Array<{
        id: number;
        previous_condition: ApiCondition;
        condition: ApiCondition;
        observations: string | null;
        recommendations: string | null;
        inspected_at: string;
        inspector: string;
        photos: string[];
    }>;
}

export interface EquipmentListResponse
{
    data: EquipmentApiRecord[];
    statistics: EquipmentStatistics;
    filters: { categories: EquipmentCategoryOption[]; };
}

export interface EquipmentItemResponse
{
    data: EquipmentApiRecord;
    message: string;
}

export interface EquipmentStatistics
{
    condition_alerts: number;
    currently_issued: number;
    good_condition: number;
    total_equipment: number;
}

export interface EquipmentCategoryOption
{
    category_code: string;
    category_name: string;
    id: number;
}

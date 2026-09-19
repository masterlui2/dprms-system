/**
 * System: DPRMS
 * Purpose: Manage equipment store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios, { AxiosError } from 'axios';
import type {
    ApiCondition,
    EquipmentApiRecord,
    EquipmentCategoryOption,
    EquipmentItemResponse,
    EquipmentListResponse,
    EquipmentStatistics,
} from '../types/api/equipment';
import { reportError } from '../utils/error_reporting';
export type { EquipmentCategoryOption, EquipmentStatistics } from '../types/api/equipment';

import type { EquipmentRecord, Program } from '../data/admin';
import g_objApi from '../lib/axios';

interface ApiErrorPayload
{
    errors?: Record<string, string[]>;
    message?: string;
}

const CONDITION_LABELS: Record<ApiCondition, EquipmentRecord['condition']> = {
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    'non-functional': 'Non-functional',
};

/** Format checked at. */
function _formatCheckedAt(strValue: string | null): string
{
    if (!strValue)
    {
        return 'Not yet inspected';
    }

    const dtDate = new Date(strValue);
    if (Number.isNaN(dtDate.getTime()))
    {
        return 'Not yet inspected';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(dtDate);
}

/** Map status. */
function _mapStatus(strStatus: string): EquipmentRecord['status']
{
    const strNormalized = strStatus.trim().toLowerCase();
    if (strNormalized === 'issued')
    {
        return 'Issued';
    }
    if (strNormalized === 'returned')
    {
        return 'Returned';
    }
    if (['condemned', 'lost', 'transferred'].includes(strNormalized))
    {
        return 'Unavailable';
    }
    return 'In storage';
}

/** Map equipment. */
function _mapEquipment(objRecord: EquipmentApiRecord): EquipmentRecord
{
    return {
        acquisitionCost: objRecord.acquisition_cost,
        acquisitionDate: objRecord.acquisition_date,
        assignedTo: objRecord.organization,
        backendId: objRecord.id,
        brand: objRecord.brand,
        category: objRecord.category,
        condition: CONDITION_LABELS[objRecord.condition],
        id: objRecord.asset_reference,
        inspectionHistory: (objRecord.inspection_history ?? []).map((objEntry) => ({
            condition: CONDITION_LABELS[objEntry.condition],
            id: objEntry.id,
            inspectedAt: objEntry.inspected_at,
            inspector: objEntry.inspector,
            observations: objEntry.observations,
            photos: objEntry.photos,
            previousCondition: CONDITION_LABELS[objEntry.previous_condition],
            recommendations: objEntry.recommendations,
        })),
        installationDate: objRecord.installed_at,
        lastCheckedAt: objRecord.last_checked_at,
        lastScanned: _formatCheckedAt(objRecord.last_checked_at),
        location: objRecord.location,
        model: objRecord.model,
        name: objRecord.equipment_name,
        propertyNumber: objRecord.property_number,
        program: objRecord.program_type,
        projectId:
            objRecord.project.reference_number ?? `Project ${objRecord.project.id ?? 'not linked'}`,
        projectTitle: objRecord.project.title ?? 'Project title not recorded',
        qrData: objRecord.qr_code?.data ?? null,
        qrReference: objRecord.qr_code?.reference ?? null,
        serialNumber: objRecord.serial_number,
        specifications: objRecord.specifications,
        status: _mapStatus(objRecord.status),
        supplier: objRecord.supplier_name,
        unit: objRecord.unit,
    };
} /* end _mapEquipment */

/** Equipment error message. */
export function equipmentErrorMessage(errError: unknown): string
{
    if (axios.isAxiosError(errError))
    {
        const errAxiosError = errError as AxiosError<ApiErrorPayload>;
        const objErrors = errAxiosError.response?.data?.errors;
        const strFirstError = objErrors ? Object.values(objErrors)[0]?.[0] : null;
        return (
            strFirstError ??
            errAxiosError.response?.data?.message ??
            'The equipment request could not be completed.'
        );
    }

    if (errError instanceof Error && errError.message)
    {
        return errError.message;
    }

    return 'The equipment request could not be completed.';
}

export interface EquipmentProjectOption
{
    cooperator: string;
    id: number;
    location: string;
    program_type: Program;
    reference_number: string;
    title: string;
}

export interface EquipmentRegistrationOptions
{
    categories: EquipmentCategoryOption[];
    programs: Program[];
    projects: EquipmentProjectOption[];
}

export interface EquipmentRegistrationPayload
{
    acquisition_cost: number;
    acquisition_date: string;
    brand: string;
    category_id: number;
    current_condition: 'GOOD' | 'FAIR' | 'POOR' | 'NON_FUNCTIONAL';
    equipment_name: string;
    installed_at?: string;
    location: string;
    model: string;
    notes?: string;
    program_type: Program;
    project_id: number;
    property_number?: string;
    serial_number: string;
    specifications?: string;
    supplier_name: string;
    unit: string;
}

export interface EquipmentInventoryResult
{
    categories: EquipmentCategoryOption[];
    equipment: EquipmentRecord[];
    statistics: EquipmentStatistics;
}

/** Fetch equipment. */
export async function fetchEquipment(
    objFilters: {
        categoryId?: number;
        condition?: string;
        program?: Program;
        search?: string;
    } = {},
): Promise<EquipmentInventoryResult>
{
    try
    {
        const objResponse = await g_objApi.get<EquipmentListResponse>('/v1/equipment', {
            params: {
                category_id: objFilters.categoryId,
                condition: objFilters.condition,
                program_type: objFilters.program,
                search: objFilters.search,
            },
        });
        return {
            categories: objResponse.data.filters?.categories ?? [],
            equipment: objResponse.data.data.map(_mapEquipment),
            statistics: objResponse.data.statistics,
        };
    } catch (errOperation)
    {
        reportError(errOperation, 'equipment_store: fetch equipment failed.');
        throw errOperation;
    }
} /* end fetchEquipment */

/** Fetch equipment details. */
export async function fetchEquipmentDetails(intId: number): Promise<EquipmentRecord>
{
    try
    {
        const objResponse = await g_objApi.get<EquipmentItemResponse>(`/v1/equipment/${intId}`);
        return _mapEquipment(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'equipment_store: fetch equipment details failed.');
        throw errOperation;
    }
}

/** Fetch equipment registration options. */
export async function fetchEquipmentRegistrationOptions(
    strProgram?: Program,
): Promise<EquipmentRegistrationOptions>
{
    try
    {
        const objResponse = await g_objApi.get<{ data: EquipmentRegistrationOptions; }>(
            '/v1/equipment/options',
            {
                params: { program_type: strProgram },
            },
        );
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'equipment_store: fetch equipment registration options failed.');
        throw errOperation;
    }
}

/** Register equipment. */
export async function registerEquipment(
    objPayload: EquipmentRegistrationPayload,
): Promise<EquipmentRecord>
{
    try
    {
        const objResponse = await g_objApi.post<EquipmentItemResponse>('/v1/equipment', objPayload);
        return _mapEquipment(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'equipment_store: register equipment failed.');
        throw errOperation;
    }
}

/** Resolve equipment qr. */
export async function resolveEquipmentQr(strQrData: string): Promise<EquipmentRecord>
{
    try
    {
        const strUserAgent = navigator.userAgent;
        const strDeviceType = /Mobi|Android/i.test(strUserAgent) ? 'mobile' : 'desktop';
        const objResponse = await g_objApi.post<EquipmentItemResponse>('/v1/equipment/qr/resolve', {
            qr_data: strQrData,
            device_type: strDeviceType,
            browser: strUserAgent.slice(0, 100),
        });

        return _mapEquipment(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'equipment_store: resolve equipment qr failed.');
        throw errOperation;
    }
}

/** Submit equipment inspection. */
export async function submitEquipmentInspection({
    asset: objAsset,
    condition: strCondition,
    remarks: txtRemarks,
    recommendations: strRecommendations,
    inspectionDate: strInspectionDate,
    photos: arrPhotos,
}: {
    asset: EquipmentRecord;
    condition: ApiCondition;
    remarks: string;
    recommendations: string;
    inspectionDate: string;
    photos: File[];
}): Promise<EquipmentRecord>
{
    try
    {
        if (!objAsset.backendId || !objAsset.qrReference)
        {
            throw new Error('This asset does not have an active backend QR record.');
        }

        const objFormData = new FormData();
        objFormData.append('condition', strCondition);
        objFormData.append('remarks', txtRemarks.trim());
        objFormData.append('recommendations', strRecommendations.trim());
        objFormData.append('inspection_date', strInspectionDate);
        objFormData.append('qr_reference', objAsset.qrReference);
        arrPhotos.forEach((objPhoto) => objFormData.append('photos[]', objPhoto));

        const objResponse = await g_objApi.post<EquipmentItemResponse>(
            `/v1/equipment/${objAsset.backendId}/inspections`,
            objFormData,
            { headers: { 'Content-Type': undefined } },
        );

        return _mapEquipment(objResponse.data.data);
    } catch (errOperation)
    {
        reportError(errOperation, 'equipment_store: submit equipment inspection failed.');
        throw errOperation;
    }
} /* end submitEquipmentInspection */

export type InspectionCondition = ApiCondition;

/**
 * System: DPRMS
 * Purpose: Manage quarter resource adapter operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
// src/services/quarterResourceAdapters.ts

import type { SetupMonitoringQuarterRecord } from '../types/setup_monitoring';
import { normalizeMonitoringDate } from '../utils/monitoring_date';

export interface ResourceAdapter<TFrontend = any>
{
    endpoint: string; // e.g. "product" -> /quarterly-metrics/{id}/product/batch
    recordKey: keyof any; // the array on SetupMonitoringQuarterRecord this pulls from
    extraOnCreate?: (udtItem: TFrontend) => Record<string, any>; // e.g. fixed `type`
    toPayload: (
        udtItem: TFrontend,
        objRecord?: SetupMonitoringQuarterRecord,
    ) => Record<string, any>; // shared create/update field map
}

export const PRODUCT_ADAPTER: ResourceAdapter = {
    endpoint: 'product',
    recordKey: 'sales',
    toPayload: (objItem: any) => ({
        product_name: objItem.productName,
        specifications: objItem.specifications,
        unit: objItem.unit,
        price: objItem.sellingPrice,
        quantity: objItem.quantity,
    }),
};

export const PRODUCTION_MATERIAL_ADAPTER: ResourceAdapter = {
    endpoint: 'production-material',
    recordKey: 'rawMaterials',
    toPayload: (objItem: any) => ({
        materials: objItem.rawMaterialName,
        unit: objItem.unit,
        quantity: objItem.quantity,
        cost: objItem.costPerUnit,
    }),
};

export const ASSET_CAPITAL_ADAPTER: ResourceAdapter = {
    endpoint: 'asset-capital',
    recordKey: 'workingCapital',
    toPayload: (objItem: any) => ({
        name: objItem.particulars,
        amount: objItem.amount,
    }),
};

// Costs: 3 frontend arrays -> 1 backend resource, distinguished by `type`
export function costAdapter(
    strRecordKey: 'operatingExpenses' | 'laborExpenses' | 'miscellaneousExpenses',
    strType: 'OPERATION' | 'LABOR' | 'MISCELLANEOUS',
): ResourceAdapter
{
    return {
        endpoint: 'cost',
        recordKey: strRecordKey,
        toPayload: (objItem: any) => ({
            particulars: objItem.particulars,
            type: strType,
            month_1: objItem.month1,
            month_2: objItem.month2,
            month_3: objItem.month3,
        }),
    };
}

// Assets: 2 frontend arrays -> 1 backend resource.
// Backend has no building/equipment column — it heuristically buckets by
// regex /building/i on `type` when re-fetched. We stamp that marker
// ourselves so round-tripping doesn't misclassify.
export function assetAdapter(
    strRecordKey: 'buildingAssets' | 'equipmentAssets',
    strKind: 'Building' | 'Equipment',
): ResourceAdapter
{
    return {
        endpoint: 'asset',
        recordKey: strRecordKey,
        toPayload: (objLeft: any) => ({
            asset_name: strKind === 'Building' ? objLeft.buildingName : objLeft.equipmentName,
            type: `${strKind}: ${strKind === 'Building' ? objLeft.buildingType : objLeft.equipmentType}`,
            lifespan: objLeft.usefulLifeYears,
            year_acquired: objLeft.yearAcquired,
            cost: objLeft.cost,
        }),
    };
}

// Linkages: 2 frontend arrays -> 1 backend resource.
// FIXED: BatchLinkageRequest validates `in:forward,backward` (spelled
// correctly). The previous 'foward' typo here caused every distributor
// create/update to fail validation. If a 'foward' typo genuinely exists
// in the DB enum/migration, fix it there instead of re-introducing it here.
export function linkageAdapter(
    strRecordKey: 'forwardDistributors' | 'forwardSuppliers',
    strType: 'forward' | 'backward',
): ResourceAdapter
{
    return {
        endpoint: 'linkage',
        recordKey: strRecordKey,
        toPayload: (objItem: any) => ({
            name: objItem.name,
            type: strType,
            male_quantity: objItem.male,
            female_quantity: objItem.female,
        }),
    };
}

// DECISION (see conversation): backend enum only supports
// ['None', 'PWD', 'Senior']. Frontend UI keeps its own richer set
// ('SC' | 'Youth' | 'PWD' | 'None') for display/filtering, but on the wire
// we map SC -> Senior and Youth -> None. This is a lossy write: a "Youth"
// employee is stored server-side indistinguishable from "None". If youth
// counts ever need to reappear after a refetch (see
// mapBackendQuarterlyMetric in setupMonitoringStore.ts), they will NOT come
// back as 'Youth' — they'll come back as 'None', because the information
// no longer exists once persisted. computeEmploymentTotals' youthCount will
// undercount for anyone re-loaded from the backend rather than kept in
// local component state since their last edit.
function _toBackendSectoralGroup(strGroup: string): 'None' | 'PWD' | 'Senior'
{
    if (strGroup === 'SC')
    {
        return 'Senior';
    }
    if (strGroup === 'Youth')
    {
        return 'None';
    }
    if (strGroup === 'PWD')
    {
        return 'PWD';
    }
    return 'None';
}

// Employees: backend has NO direct/indirect column yet (see note 3 in
// mapBackendQuarterlyMetric). Both arrays merge into the same resource;
// on refetch everything currently lands back in directEmployees.
export function employeeAdapter(
    strRecordKey: 'directEmployees' | 'indirectEmployees',
): ResourceAdapter
{
    return {
        endpoint: 'employee',
        recordKey: strRecordKey,
        toPayload: (objEvent: any) => ({
            employee_name: objEvent.name,
            age: objEvent.age,
            // FIXED: backend Rule::in expects 'Part-Timer' (capital T); frontend
            // EmployeeItem type uses 'Part-timer'. Normalize here so the type
            // definition doesn't have to change everywhere it's used in the UI.
            status:
                objEvent.employmentStatus === 'Part-timer'
                    ? 'Part-Timer'
                    : objEvent.employmentStatus,
            gender: objEvent.sex,
            sectoral_group: _toBackendSectoralGroup(objEvent.sectoralGroup),
            sectoral_classification:
                objEvent.sectoralGroup === 'SC' ? 'Senior' : objEvent.sectoralGroup,
            employment_type: strRecordKey === 'indirectEmployees' ? 'INDIRECT' : 'DIRECT',
            days_of_attendance: objEvent.workdaysQuarter,
            salary_rate: objEvent.salaryRate,
        }),
    };
}

// Markets: backend has NO international/local column yet — same caveat as employees.
export function marketAdapter(
    strRecordKey: 'internationalMarkets' | 'localMarkets',
): ResourceAdapter
{
    return {
        endpoint: 'market',
        recordKey: strRecordKey,
        toPayload: (objItem: any, objRecord) =>
        {
            const strEffectiveDate = normalizeMonitoringDate(
                objItem.effectivityDate,
                objRecord?.year,
            );

            return {
                market_name: objItem.marketName,
                market_type: strRecordKey === 'internationalMarkets' ? 'INTERNATIONAL' : 'LOCAL',
                address: objItem.address,
                condition: (objItem.condition || 'NEW').toLowerCase(),
                ...(strEffectiveDate ? { effective_date: strEffectiveDate } : {}),
                contact_person: objItem.contactPerson,
                service: objItem.productServiceSold,
                volume: objItem.volumeDelivered,
            };
        },
    };
}

// Interventions: 5 frontend arrays -> 1 backend resource, distinguished by `type`.
export function interventionAdapter(
    strRecordKey:
        'consultancies' | 'trainings' | 'techTransfers' | 'supportServices' | 'otherProjects',
    strType: 'CONSULTANCY' | 'TRAINING' | 'TECHNOLOGY' | 'TESTING' | 'OTHERS',
): ResourceAdapter
{
    return {
        endpoint: 'intervention',
        recordKey: strRecordKey,
        toPayload: (objItem: any, objRecord) =>
        {
            const strDate = normalizeMonitoringDate(objItem.date, objRecord?.year);
            const objDatePayload = strDate ? { date: strDate } : {};

            switch (strType)
            {
                case 'CONSULTANCY':
                    return {
                        name: objItem.serviceName,
                        type: strType,
                        availed: !!objItem.availed,
                        intervention: objItem.areaOfIntervention,
                        ...objDatePayload,
                    };
                case 'TRAINING':
                    return {
                        name: objItem.trainingName,
                        type: strType,
                        availed: true,
                        intervention: objItem.category,
                        ...objDatePayload,
                    };
                case 'TECHNOLOGY':
                    return {
                        name: objItem.details,
                        type: strType,
                        availed: true,
                        intervention: objItem.type,
                        ...objDatePayload,
                    };
                case 'TESTING':
                    return {
                        name: objItem.productTestedParameters,
                        type: strType,
                        availed: true,
                        intervention: objItem.type,
                        ...objDatePayload,
                    };
                case 'OTHERS':
                    return {
                        name: objItem.projectTitle,
                        type: strType,
                        availed: true,
                        intervention: 'N/A',
                        ...objDatePayload,
                    };

                default:
                    throw new Error('Unsupported intervention type.');
            }
        },
    };
} /* end interventionAdapter */

export const RESOURCE_ADAPTERS: ResourceAdapter[] = [
    PRODUCT_ADAPTER,
    PRODUCTION_MATERIAL_ADAPTER,
    ASSET_CAPITAL_ADAPTER,
    costAdapter('operatingExpenses', 'OPERATION'),
    costAdapter('laborExpenses', 'LABOR'),
    costAdapter('miscellaneousExpenses', 'MISCELLANEOUS'),
    assetAdapter('buildingAssets', 'Building'),
    assetAdapter('equipmentAssets', 'Equipment'),
    linkageAdapter('forwardDistributors', 'forward'),
    linkageAdapter('forwardSuppliers', 'backward'),
    employeeAdapter('directEmployees'),
    employeeAdapter('indirectEmployees'),
    marketAdapter('internationalMarkets'),
    marketAdapter('localMarkets'),
    interventionAdapter('consultancies', 'CONSULTANCY'),
    interventionAdapter('trainings', 'TRAINING'),
    interventionAdapter('techTransfers', 'TECHNOLOGY'),
    interventionAdapter('supportServices', 'TESTING'),
    interventionAdapter('otherProjects', 'OTHERS'),
];

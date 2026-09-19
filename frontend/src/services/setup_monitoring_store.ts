/**
 * System: DPRMS
 * Purpose: Manage setup monitoring store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ProjectRecord } from '../data/admin';
import g_objApi from '../lib/axios';
import type {
    BackendQuarterlyMetric,
    BackendQuarterlyMetricsResponse,
    BackendSetupMonitoringProject,
    BackendSetupMonitoringResponse,
    CreateQuarterlyMetricResponse,
} from '../types/api/setup_monitoring';
import type { ProjectPagination } from '../types/monitoring';
import type {
    BuildingAsset,
    ConsultancyItem,
    EmployeeItem,
    EquipmentAsset,
    MarketOutletItem,
    MonthlyExpenseItem,
    OtherDostProjectItem,
    ProductSalesItem,
    Quarter,
    RawMaterialItem,
    SetupMonitoringQuarterRecord,
    SupportServiceItem,
    TechTransferItem,
    TrainingItem,
    WorkerCount,
    WorkingCapitalItem,
} from '../types/setup_monitoring';
import { reportError } from '../utils/error_reporting';
import { normalizeMonitoringDate } from '../utils/monitoring_date';
export type {
    BackendQuarterlyAssetCapitalItem,
    BackendQuarterlyAssetItem,
    BackendQuarterlyEmployeeItem,
    BackendQuarterlyInterventionItem,
    BackendQuarterlyLinkageItem,
    BackendQuarterlyMarketItem,
    BackendQuarterlyMetric,
    BackendQuarterlyNarrativeItem,
    BackendQuarterlyProductCostItem,
    BackendQuarterlyProductionMaterialItem,
    BackendQuarterlyProductItem,
    CreateQuarterlyMetricResponse,
} from '../types/api/setup_monitoring';

const STORAGE_PREFIX = 'dprms_setup_monitoring_record_';

/** Create empty quarter record. */
function _createEmptyQuarterRecord(
    strProjectId: string,
    intYear: number,
    strQuarter: Quarter,
): SetupMonitoringQuarterRecord
{
    return {
        id: `${strProjectId}-${intYear}-${strQuarter}`,
        projectId: strProjectId,
        enterpriseName: '',
        enterpriseAddress: '',
        year: intYear,
        quarter: strQuarter,
        dateOfVisit: '',
        status: 'Draft',
        buildingAssets: [],
        equipmentAssets: [],
        workingCapital: [],
        internationalMarkets: [],
        localMarkets: [],
        forwardDistributors: [],
        forwardSuppliers: [],
        directEmployees: [],
        indirectEmployees: [],
        consultancies: [],
        trainings: [],
        techTransfers: [],
        supportServices: [],
        otherProjects: [],
        operatingExpenses: [],
        laborExpenses: [],
        rawMaterials: [],
        miscellaneousExpenses: [],
        sales: [],
        problemsAndActions: {
            humanResource: '',
            technical: '',
            financial: '',
            market: '',
        },
        plansForImprovement: {
            humanResource: '',
            technical: '',
            financial: '',
            market: '',
        },
        signOff: {
            interviewerName: '',
            interviewerDesignation: '',
            interviewerSignatureDate: '',
            respondentName: '',
            respondentDesignation: '',
            respondentSignatureDate: '',
            dateOfVisit: '',
        },
    };
} /* end _createEmptyQuarterRecord */

/** Calculate building depreciation. */
export function calculateBuildingDepreciation(curCost: number, intUsefulLifeYears: number): number
{
    if (!intUsefulLifeYears || intUsefulLifeYears <= 0)
    {
        return 0;
    }
    return Math.round((curCost / intUsefulLifeYears) * 100) / 100;
}

/** Calculate building book value. */
export function calculateBuildingBookValue(
    curCost: number,
    intUsefulLifeYears: number,
    intYearAcquired: number,
    intCurrentYear = 2026,
): number
{
    if (!intUsefulLifeYears || intUsefulLifeYears <= 0)
    {
        return 0;
    }
    const curDepreciation = calculateBuildingDepreciation(curCost, intUsefulLifeYears);
    const intElapsedYears = Math.max(0, intCurrentYear - intYearAcquired);
    return Math.max(0, Math.round((curCost - intElapsedYears * curDepreciation) * 100) / 100);
}

/** Calculate equipment depreciation. */
export function calculateEquipmentDepreciation(
    curCost: number,
    intUsefulLifeYears: number,
): number
{
    if (!intUsefulLifeYears || intUsefulLifeYears <= 0)
    {
        return 0;
    }
    return Math.round((curCost / intUsefulLifeYears) * 100) / 100;
}

/** Calculate equipment book value. */
export function calculateEquipmentBookValue(
    curCost: number,
    intUsefulLifeYears: number,
    intYearAcquired: number,
    intCurrentYear = 2026,
): number
{
    if (!intUsefulLifeYears || intUsefulLifeYears <= 0)
    {
        return 0;
    }
    const curDepreciation = calculateEquipmentDepreciation(curCost, intUsefulLifeYears);
    const intElapsedYears = Math.max(0, intCurrentYear - intYearAcquired);
    return Math.max(0, Math.round((curCost - intElapsedYears * curDepreciation) * 100) / 100);
}

/** Compute sales totals. */
export function computeSalesTotals(objRecord: SetupMonitoringQuarterRecord)
{
    const curGrandTotalSales = objRecord.sales.reduce(
        (intSum, objItem) => intSum + (objItem.totalSales || 0),
        0,
    );
    const objCostTotals = computeProductionCostTotals(objRecord);
    const intNetProfit = curGrandTotalSales - objCostTotals.grandTotalProductionCost;
    const intProfitMargin =
        curGrandTotalSales > 0 ? Math.round((intNetProfit / curGrandTotalSales) * 1000) / 10 : 0;

    return {
        grandTotalSales: curGrandTotalSales,
        netProfit: intNetProfit,
        profitMargin: intProfitMargin,
    };
}

/** Compute production cost totals. */
export function computeProductionCostTotals(objRecord: SetupMonitoringQuarterRecord)
{
    const intOperatingTotal = objRecord.operatingExpenses.reduce(
        (intSum, objItem) => intSum + (objItem.total || 0),
        0,
    );
    const intLaborTotal = objRecord.laborExpenses.reduce(
        (intSum, objItem) => intSum + (objItem.total || 0),
        0,
    );
    const intRawMaterialsTotal = objRecord.rawMaterials.reduce(
        (intSum, objItem) => intSum + (objItem.totalCost || 0),
        0,
    );
    const intMiscTotal = objRecord.miscellaneousExpenses.reduce(
        (intSum, objItem) => intSum + (objItem.total || 0),
        0,
    );

    const curGrandTotalProductionCost =
        intOperatingTotal + intLaborTotal + intRawMaterialsTotal + intMiscTotal;

    return {
        operatingTotal: intOperatingTotal,
        laborTotal: intLaborTotal,
        rawMaterialsTotal: intRawMaterialsTotal,
        miscTotal: intMiscTotal,
        grandTotalProductionCost: curGrandTotalProductionCost,
    };
}

/** Compute employment totals. */
export function computeEmploymentTotals(objRecord: SetupMonitoringQuarterRecord)
{
    const arrAllEmployees = [...objRecord.directEmployees, ...objRecord.indirectEmployees];
    const intTotalEmployees = arrAllEmployees.length;
    const intMaleCount = arrAllEmployees.filter((objEvent) => objEvent.sex === 'Male').length;
    const intFemaleCount = arrAllEmployees.filter((objEvent) => objEvent.sex === 'Female').length;

    const intScCount = arrAllEmployees.filter((objEvent) => objEvent.sectoralGroup === 'SC').length;
    const intYouthCount = arrAllEmployees.filter(
        (objEvent) => objEvent.sectoralGroup === 'Youth',
    ).length;
    const intPwdCount = arrAllEmployees.filter(
        (objEvent) => objEvent.sectoralGroup === 'PWD',
    ).length;

    const curDirectSalaryTotal = objRecord.directEmployees.reduce(
        (intSum, objEvent) => intSum + (objEvent.totalSalaryQuarter || 0),
        0,
    );
    const curIndirectSalaryTotal = objRecord.indirectEmployees.reduce(
        (intSum, objEvent) => intSum + (objEvent.totalSalaryQuarter || 0),
        0,
    );

    const intRegularCount = arrAllEmployees.filter(
        (objEvent) => objEvent.employmentStatus === 'Regular',
    ).length;
    const intContractualCount = arrAllEmployees.filter(
        (objEvent) => objEvent.employmentStatus !== 'Regular',
    ).length;

    const intForwardDistributorMale = objRecord.forwardDistributors.reduce(
        (intSum, objItem) => intSum + (objItem.male || 0),
        0,
    );
    const intForwardDistributorFemale = objRecord.forwardDistributors.reduce(
        (intSum, objItem) => intSum + (objItem.female || 0),
        0,
    );
    const intForwardDistributorTotal = objRecord.forwardDistributors.reduce(
        (intSum, objItem) => intSum + (objItem.total || 0),
        0,
    );

    const intForwardSupplierMale = objRecord.forwardSuppliers.reduce(
        (intSum, objItem) => intSum + (objItem.male || 0),
        0,
    );
    const intForwardSupplierFemale = objRecord.forwardSuppliers.reduce(
        (intSum, objItem) => intSum + (objItem.female || 0),
        0,
    );
    const intForwardSupplierTotal = objRecord.forwardSuppliers.reduce(
        (intSum, objItem) => intSum + (objItem.total || 0),
        0,
    );

    return {
        totalEmployees: intTotalEmployees,
        maleCount: intMaleCount,
        femaleCount: intFemaleCount,
        scCount: intScCount,
        youthCount: intYouthCount,
        pwdCount: intPwdCount,
        directSalaryTotal: curDirectSalaryTotal,
        indirectSalaryTotal: curIndirectSalaryTotal,
        regularCount: intRegularCount,
        contractualCount: intContractualCount,
        forwardDistributorMale: intForwardDistributorMale,
        forwardDistributorFemale: intForwardDistributorFemale,
        forwardDistributorTotal: intForwardDistributorTotal,
        forwardSupplierMale: intForwardSupplierMale,
        forwardSupplierFemale: intForwardSupplierFemale,
        forwardSupplierTotal: intForwardSupplierTotal,
    };
} /* end computeEmploymentTotals */

/** Create default quarter record. */
export function createDefaultQuarterRecord(
    strProjectId: string,
    intYear = 2026,
    strQuarter: Quarter = 'Q2',
): SetupMonitoringQuarterRecord
{
    return {
        id: `${strProjectId}-${intYear}-${strQuarter}`,
        projectId: strProjectId,
        enterpriseName: 'Madayaway Food Products',
        enterpriseAddress: 'Lower Kapayas, Brgy. Matiao, Mati City, Davao Oriental',
        year: intYear,
        quarter: strQuarter,
        dateOfVisit: '2026-06-20',
        status: 'Verified',

        buildingAssets: [
            {
                id: 'b1',
                buildingName: 'Production Building',
                buildingType: 'Concrete',
                usefulLifeYears: 30,
                yearAcquired: 2017,
                cost: 500000,
                depreciation: 16666.67,
                bookValue: 383333.33,
            },
        ],

        equipmentAssets: [
            {
                id: 'eq1',
                equipmentName: 'Large Format Printer & Packaging Machine',
                equipmentType: 'Technical and Scientific Equipment',
                usefulLifeYears: 10,
                yearAcquired: 2016,
                cost: 1000000,
                depreciation: 100000,
                bookValue: 500000,
            },
        ],

        workingCapital: [
            { id: 'wc1', particulars: 'Production Cost', amount: 154000 },
            { id: 'wc2', particulars: 'Representation & Logistics', amount: 25000 },
        ],

        internationalMarkets: [
            {
                id: 'im1',
                marketType: 'INTERNATIONAL',
                marketName: 'Target Supercenter Export',
                address: 'New York, NY, USA',
                condition: 'OLD',
                effectivityDate: '',
                contactPerson: 'Maria Dela Cruz',
                productServiceSold: 'Coconut Vinegar / Wine Condiments',
                volumeDelivered: '5000 bottles',
            },
        ],

        localMarkets: [
            {
                id: 'lm1',
                marketType: 'LOCAL',
                marketName: 'Subangan Museum Souvenir Shop',
                address: 'Mati, Davao Oriental',
                condition: 'OLD',
                effectivityDate: '',
                contactPerson: 'Maria Dela Cruz',
                productServiceSold: 'Bottles of Vinegar & Sauces',
                volumeDelivered: '5000 bottles',
            },
            {
                id: 'lm2',
                marketType: 'LOCAL',
                marketName: 'ER Supermall Supermarket',
                address: 'Mati City Center',
                condition: 'OLD',
                effectivityDate: '',
                contactPerson: 'Manager Jocelyn',
                productServiceSold: 'Assorted Gourmet Condiments',
                volumeDelivered: '2400 bottles',
            },
            {
                id: 'lm3',
                marketType: 'LOCAL',
                marketName: 'Abreeza Mall Davao Outlet',
                address: 'JP Laurel Ave, Davao City',
                condition: 'NEW',
                effectivityDate: '2026-04-15',
                contactPerson: 'Arthur Tan',
                productServiceSold: 'Spiced Vinegar Series',
                volumeDelivered: '3200 bottles',
            },
        ],

        forwardDistributors: [
            { id: 'fd1', name: 'ER Supermall', male: 0, female: 1, total: 1 },
            { id: 'fd2', name: 'Tita Venus Catering', male: 0, female: 1, total: 1 },
            { id: 'fd3', name: 'Subangan Museum', male: 0, female: 1, total: 1 },
            { id: 'fd4', name: 'Pasalubong Center (Pintatagan)', male: 0, female: 1, total: 1 },
            { id: 'fd5', name: 'DTI-Go Negosyo Center', male: 0, female: 1, total: 1 },
            { id: 'fd6', name: 'Abreeza Davao Retail Hub', male: 1, female: 3, total: 4 },
            { id: 'fd7', name: 'Panabo Public Market Stalls', male: 2, female: 1, total: 3 },
            { id: 'fd8', name: 'Tagum Public Market Hub', male: 1, female: 1, total: 2 },
            { id: 'fd9', name: 'Piapi-Boulevard Public Market', male: 0, female: 1, total: 1 },
            { id: 'fd10', name: 'Digos Public Market', male: 0, female: 1, total: 1 },
        ],

        forwardSuppliers: [
            { id: 'fs1', name: 'Itok Raw Coconut Supply', male: 1, female: 0, total: 1 },
            { id: 'fs2', name: 'Enteng Neri Farm', male: 1, female: 0, total: 1 },
            { id: 'fs3', name: 'Jun Mahusay Spices', male: 1, female: 0, total: 1 },
            { id: 'fs4', name: 'Mati Spice Growers', male: 2, female: 3, total: 5 },
            { id: 'fs5', name: 'Davao Bottle & Glass Packaging', male: 5, female: 0, total: 5 },
            { id: 'fs6', name: 'Recycling Junkshop Partner', male: 3, female: 0, total: 3 },
            { id: 'fs7', name: 'Delia Caraga Agri', male: 0, female: 1, total: 1 },
        ],

        directEmployees: [
            {
                id: 'de1',
                type: 'DIRECT',
                name: 'Juana Dela Cruz',
                age: 19,
                employmentStatus: 'Regular',
                sex: 'Female',
                sectoralGroup: 'Youth',
                workdaysQuarter: 24,
                salaryType: 'Daily',
                salaryRate: 250,
                totalSalaryQuarter: 27000,
            },
            {
                id: 'de2',
                type: 'DIRECT',
                name: 'Ricardo Neri',
                age: 34,
                employmentStatus: 'Regular',
                sex: 'Male',
                sectoralGroup: 'None',
                workdaysQuarter: 26,
                salaryType: 'Monthly',
                salaryRate: 15000,
                totalSalaryQuarter: 45000,
            },
        ],

        indirectEmployees: [
            {
                id: 'ie1',
                type: 'INDIRECT',
                name: 'Jocelyn Morales',
                age: 28,
                employmentStatus: 'Project-Based',
                sex: 'Female',
                sectoralGroup: 'Youth',
                workdaysQuarter: 24,
                salaryType: 'Monthly',
                salaryRate: 18000,
                totalSalaryQuarter: 54000,
            },
            {
                id: 'ie2',
                type: 'INDIRECT',
                name: 'Enteng Gomez',
                age: 62,
                employmentStatus: 'Contract-Based',
                sex: 'Male',
                sectoralGroup: 'SC',
                workdaysQuarter: 20,
                salaryType: 'Daily',
                salaryRate: 350,
                totalSalaryQuarter: 21000,
            },
        ],

        consultancies: [
            {
                id: 'c1',
                serviceName: 'MPEX (Manufacturing Productivity Extension)',
                availed: true,
                areaOfIntervention: 'Plant layout optimization and sanitation flow',
                date: '2026-03-12',
            },
            {
                id: 'c2',
                serviceName: 'CPT (Cleaner Production Technology)',
                availed: false,
                areaOfIntervention: '',
                date: '',
            },
            {
                id: 'c3',
                serviceName: 'Energy Audit',
                availed: true,
                areaOfIntervention: 'Power load monitoring and heat insulation',
                date: '2026-04-05',
            },
            {
                id: 'c4',
                serviceName: 'Plant Layout (FS)',
                availed: true,
                areaOfIntervention: 'Hazard analysis flow restructuring',
                date: '2026-02-18',
            },
            {
                id: 'c5',
                serviceName: 'GMP Assessment',
                availed: true,
                areaOfIntervention: 'Compliance pre-audit for FDA LTO renewal',
                date: '2026-05-10',
            },
            {
                id: 'c6',
                serviceName: 'In-House GMP Training',
                availed: true,
                areaOfIntervention: 'All production and handling personnel',
                date: '2026-05-15',
            },
            {
                id: 'c7',
                serviceName: 'Packaging and Labelling',
                availed: true,
                areaOfIntervention: 'Nutritional fact sheet and barcode label redesign',
                date: '2026-03-22',
            },
        ],

        trainings: [
            {
                id: 't1',
                category: 'DOST',
                trainingName: 'DOST Food Safety & Basic Sanitation Seminar',
                date: '2026-02-25',
            },
            {
                id: 't2',
                category: 'RDI',
                trainingName: 'Thermal Processing and Fermentation Controls (ITDI/FNRI)',
                date: '2026-04-12',
            },
            {
                id: 't3',
                category: 'FPIC',
                trainingName: 'FPIC Davao Regional Product Standardization Workshop',
                date: '2026-05-08',
            },
        ],

        techTransfers: [
            {
                id: 'tt1',
                type: 'TNA',
                details: 'Technological Needs Assessment on Automated Filling Line',
                date: '2026-01-20',
            },
            {
                id: 'tt2',
                type: 'EQUIPMENT',
                details: 'Turnover of 1 Unit Semi-Automatic Liquid Bottle Filler & Capper',
                date: '2026-03-15',
            },
            {
                id: 'tt3',
                type: 'PRODUCTS_DEVELOPED',
                details: 'Spiced Vinegar Long Neck (Export Grade Variant)',
                date: '2026-04-10',
            },
        ],

        supportServices: [
            {
                id: 'ss1',
                type: 'Microbiology',
                productTestedParameters: 'E. Coli, Salmonella, Yeast and Mold Count - Passed',
                date: '2026-03-30',
            },
            {
                id: 'ss2',
                type: 'Chemical',
                productTestedParameters: 'Acidity titration, pH level, heavy metals screening',
                date: '2026-03-30',
            },
            {
                id: 'ss3',
                type: 'Calibration',
                productTestedParameters: 'Digital refractometer and temperature probe calibration',
                date: '2026-02-14',
            },
            {
                id: 'ss4',
                type: 'Shelf Life',
                productTestedParameters: 'Accelerated 18-month shelf-life stability test protocol',
                date: '2026-05-02',
            },
        ],

        otherProjects: [
            {
                id: 'op1',
                projectTitle: 'DOST Packaging Assistance Program (PapBox)',
                date: '2026-01-15',
            },
        ],

        operatingExpenses: [
            {
                id: 'oe1',
                particulars: 'Power (Electricity)',
                month1: 4200,
                month2: 4600,
                month3: 4900,
                total: 13700,
            },
            {
                id: 'oe2',
                particulars: 'Water Utility',
                month1: 1100,
                month2: 1250,
                month3: 1300,
                total: 3650,
            },
            {
                id: 'oe3',
                particulars: 'Rent of Facility',
                month1: 8000,
                month2: 8000,
                month3: 8000,
                total: 24000,
            },
            {
                id: 'oe4',
                particulars: 'Fuel (Vehicles & Operations)',
                month1: 3500,
                month2: 4100,
                month3: 3800,
                total: 11400,
            },
            {
                id: 'oe5',
                particulars: 'Internet & Communications',
                month1: 1800,
                month2: 1800,
                month3: 1800,
                total: 5400,
            },
            {
                id: 'oe6',
                particulars: 'Equipment Maintenance',
                month1: 1200,
                month2: 800,
                month3: 2200,
                total: 4200,
            },
            {
                id: 'oe7',
                particulars: 'PHIC Premium Expense',
                month1: 1400,
                month2: 1400,
                month3: 1400,
                total: 4200,
            },
            {
                id: 'oe8',
                particulars: 'SSS Premium Expense',
                month1: 2800,
                month2: 2800,
                month3: 2800,
                total: 8400,
            },
            {
                id: 'oe9',
                particulars: 'Distribution Commissions',
                month1: 2500,
                month2: 3200,
                month3: 3000,
                total: 8700,
            },
        ],

        laborExpenses: [
            {
                id: 'le1',
                particulars: 'Regular Employees Payroll',
                month1: 24000,
                month2: 24000,
                month3: 24000,
                total: 72000,
            },
            {
                id: 'le2',
                particulars: 'Contractual / Project Labor',
                month1: 15000,
                month2: 18000,
                month3: 17000,
                total: 50000,
            },
        ],

        rawMaterials: [
            {
                id: 'rm1',
                rawMaterialName: 'Tuba / Fermented Sap',
                unit: 'Liters',
                quantity: 3500,
                costPerUnit: 15,
                totalCost: 52500,
            },
            {
                id: 'rm2',
                rawMaterialName: 'Garlic Bulbs',
                unit: 'Kilograms',
                quantity: 180,
                costPerUnit: 120,
                totalCost: 21600,
            },
            {
                id: 'rm3',
                rawMaterialName: 'Native Chili (Siling Labuyo)',
                unit: 'Kilograms',
                quantity: 95,
                costPerUnit: 180,
                totalCost: 17100,
            },
            {
                id: 'rm4',
                rawMaterialName: 'Red Onion',
                unit: 'Kilograms',
                quantity: 120,
                costPerUnit: 100,
                totalCost: 12000,
            },
            {
                id: 'rm5',
                rawMaterialName: 'Ginger / Luya',
                unit: 'Kilograms',
                quantity: 80,
                costPerUnit: 90,
                totalCost: 7200,
            },
            {
                id: 'rm6',
                rawMaterialName: 'Iodized Sea Salt',
                unit: 'Sacks (25kg)',
                quantity: 15,
                costPerUnit: 450,
                totalCost: 6750,
            },
            {
                id: 'rm7',
                rawMaterialName: 'Langkawas / Blue Ginger',
                unit: 'Kilograms',
                quantity: 45,
                costPerUnit: 110,
                totalCost: 4950,
            },
            {
                id: 'rm8',
                rawMaterialName: 'LPG Gas Refill',
                unit: 'Tanks (50kg)',
                quantity: 6,
                costPerUnit: 2200,
                totalCost: 13200,
            },
        ],

        miscellaneousExpenses: [
            {
                id: 'me1',
                particulars: 'Sanitation Supplies & Disinfectants',
                month1: 1500,
                month2: 1200,
                month3: 1800,
                total: 4500,
            },
            {
                id: 'me2',
                particulars: 'Packaging Tape & Corrugated Boxes',
                month1: 2400,
                month2: 2800,
                month3: 3100,
                total: 8300,
            },
        ],

        sales: [
            {
                id: 's1',
                productName: "Ric's Vinegar Junior Lapad",
                specifications: 'SC (Spiced Classic)',
                unit: 'Bottles (350ml)',
                sellingPrice: 45,
                quantity: 2400,
                totalSales: 108000,
            },
            {
                id: 's2',
                productName: "Ric's Vinegar Junior Lapad",
                specifications: 'SH (Spiced Hot)',
                unit: 'Bottles (350ml)',
                sellingPrice: 48,
                quantity: 1800,
                totalSales: 86400,
            },
            {
                id: 's3',
                productName: "Ric's Vinegar Junior Lapad",
                specifications: 'SW (Sweet & Sour)',
                unit: 'Bottles (350ml)',
                sellingPrice: 50,
                quantity: 1200,
                totalSales: 60000,
            },
            {
                id: 's4',
                productName: "Ric's Vinegar Senior Lapad",
                specifications: 'SC (Spiced Classic)',
                unit: 'Bottles (500ml)',
                sellingPrice: 65,
                quantity: 1600,
                totalSales: 104000,
            },
            {
                id: 's5',
                productName: "Ric's Vinegar Senior Lapad",
                specifications: 'SH (Spiced Hot)',
                unit: 'Bottles (500ml)',
                sellingPrice: 68,
                quantity: 1400,
                totalSales: 95200,
            },
            {
                id: 's6',
                productName: "Ric's Vinegar Long Neck",
                specifications: 'SC (Spiced Classic Premium)',
                unit: 'Bottles (750ml)',
                sellingPrice: 95,
                quantity: 950,
                totalSales: 90250,
            },
            {
                id: 's7',
                productName: "Ric's Vinegar Long Neck",
                specifications: 'SH (Spiced Hot Premium)',
                unit: 'Bottles (750ml)',
                sellingPrice: 98,
                quantity: 820,
                totalSales: 80360,
            },
        ],

        problemsAndActions: {
            humanResource:
                'Temporary shortage of contractual bottle-washers during seasonal harvest surge; addressed by optimizing line rotation and scheduling weekend shifts with overtime incentive.',
            technical:
                'Minor temperature fluctuations on heat-sealing band on packaging line; calibrated heating elements with DOST testing engineer assistance.',
            financial:
                'Delayed payment remittances from provincial public market consignment partners; instituted standard 15-day collection window and direct bank deposit terms.',
            market: 'Chili price spikes due to heavy monsoon rains in Upper Davao; negotiated fixed quarterly volume agreement with local agricultural cooperative.',
        },

        plansForImprovement: {
            humanResource:
                'Hire 2 additional regular packaging workers and enroll supervisors in DOST HACCP Level 2 accreditation.',
            technical:
                'Procure 1 unit semi-automated rotary bottle labeling applicator to double output speed.',
            financial:
                'Reinvest 25% of quarterly net profit into bulk raw spice inventory reserve.',
            market: 'Expand institutional distribution footprint to Panabo Supermarkets and online pasalubong delivery platforms.',
        },

        signOff: {
            interviewerName: 'ENGR. GLENN D. MORALES',
            interviewerDesignation: 'PSTO Davao Oriental - Science Research Specialist II',
            interviewerSignatureDate: '2026-06-25',
            respondentName: 'JUANA DELA CRUZ',
            respondentDesignation: 'General Manager / Enterprise Representative',
            respondentSignatureDate: '2026-06-25',
            dateOfVisit: '2026-06-20',
        },
    };
} /* end createDefaultQuarterRecord */

/** Get quarter record. */
export function getQuarterRecord(
    strProjectId: string,
    intYear = 2026,
    strQuarter: Quarter = 'Q2',
): SetupMonitoringQuarterRecord
{
    const strKey = `${STORAGE_PREFIX}${strProjectId}_${intYear}_${strQuarter}`;
    try
    {
        const strItem = localStorage.getItem(strKey);
        if (strItem)
        {
            return JSON.parse(strItem) as SetupMonitoringQuarterRecord;
        }
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_monitoring_store: get quarter record failed.');

        // fallback
    }

    return _createEmptyQuarterRecord(strProjectId, intYear, strQuarter);
}

/** Save quarter record. */
export function saveQuarterRecord(objRecord: SetupMonitoringQuarterRecord): void
{
    const strKey = `${STORAGE_PREFIX}${objRecord.projectId}_${objRecord.year}_${objRecord.quarter}`;
    try
    {
        localStorage.setItem(strKey, JSON.stringify(objRecord));
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_monitoring_store: save quarter record failed.');

        // ignore
    }
}

/** Get all saved monitoring records. */
export function getAllSavedMonitoringRecords(): SetupMonitoringQuarterRecord[]
{
    const arrRecords: SetupMonitoringQuarterRecord[] = [];
    try
    {
        let intIndex = 0;
        for (; intIndex < localStorage.length; intIndex++)
        {
            const strKey = localStorage.key(intIndex);
            if (strKey && strKey.startsWith(STORAGE_PREFIX))
            {
                const strValue = localStorage.getItem(strKey);
                if (strValue)
                {
                    arrRecords.push(JSON.parse(strValue));
                }
            }
        }
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_monitoring_store: get all saved monitoring records failed.');

        // fallback
    }
    return arrRecords;
}

export interface SetupMonitoringStatistics
{
    activeProjects: number;
    monitoredCount: number;
    pendingReports: number;
}

export interface SetupMonitoringProjectFilters
{
    search?: string;
    district?: string;
    year?: number;
    quarter?: Quarter;
    page?: number;
    perPage?: number;
}

export interface SetupMonitoringProjectsResult
{
    projects: ProjectRecord[];
    statistics: SetupMonitoringStatistics;
    districts: string[];
    pagination: ProjectPagination;
}

/** Format monitoring date. */
function _formatMonitoringDate(strValue: string | null): string
{
    if (!strValue)
    {
        return 'Not scheduled';
    }

    const dtDate = new Date(strValue);
    if (Number.isNaN(dtDate.getTime()))
    {
        return strValue;
    }

    return dtDate.toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Map setup monitoring project. */
function _mapSetupMonitoringProject(objProject: BackendSetupMonitoringProject): ProjectRecord
{
    const strLocation =
        [objProject.district, objProject.province].filter(Boolean).join(', ') ||
        objProject.business_address ||
        'Location not recorded';

    return {
        approvedAt: objProject.approved_at,
        startDate: objProject.start_date,
        backendId: objProject.id,
        proposalId: objProject.proposal_id ?? objProject.id,
        budget: objProject.setup_funding,
        compliance: objProject.pending_reports > 0 ? 'Due soon' : 'Compliant',
        contactNumber: objProject.contact_number,
        proponentName: objProject.proponent_name,
        industrySector: objProject.industry_sector,
        businessStructure: objProject.business_structure,
        enterpriseSize: objProject.enterprise_size,
        focalOfficer: objProject.focal_officer,
        equipmentRecords: objProject.equipment_records,
        district: objProject.district ?? undefined,
        dueDate: _formatMonitoringDate(
            objProject.latest_report?.due_date ?? objProject.expected_end_date,
        ),
        enterprise: objProject.enterprise_name,
        fullRelease: objProject.full_release,
        id: String(objProject.id),
        lastMonitoredAt: objProject.last_monitored_at,
        checklistStats: objProject.checklist_stats,
        latestReport: objProject.latest_report
            ? {
                dueDate: objProject.latest_report.due_date,
                quarter: objProject.latest_report.quarter,
                reportingPeriod: objProject.latest_report.reporting_period,
                status: objProject.latest_report.status,
                year: objProject.latest_report.year,
            }
            : null,
        location: strLocation,
        manager: objProject.manager,
        monitored: objProject.monitored,
        monitoringStatus: objProject.monitoring_status,
        pendingReports: objProject.pending_reports,
        program: 'SETUP',
        progress: Math.max(0, Math.min(100, Math.round(objProject.overall_compliance))),
        referenceNumber: objProject.reference_number,
        status: 'Active',
        title: objProject.title,
        used: objProject.amount_refunded ?? 0,
    };
} /* end _mapSetupMonitoringProject */

/** Fetch setup monitoring projects. */
export async function fetchSetupMonitoringProjects(
    objFilters: SetupMonitoringProjectFilters,
): Promise<SetupMonitoringProjectsResult>
{
    try
    {
        const objResponse = await g_objApi.get<BackendSetupMonitoringResponse>(
            '/setup/monitoring/projects',
            {
                params: {
                    search: objFilters.search?.trim() || undefined,
                    district: objFilters.district || undefined,
                    year: objFilters.year,
                    quarter: objFilters.quarter ? Number(objFilters.quarter.slice(1)) : undefined,
                    page: objFilters.page ?? 1,
                    per_page: objFilters.perPage,
                },
            },
        );

        return {
            projects: objResponse.data.data.map(_mapSetupMonitoringProject),
            statistics: {
                activeProjects: objResponse.data.statistics.active_projects,
                monitoredCount: objResponse.data.statistics.monitored_count,
                pendingReports: objResponse.data.statistics.pending_reports,
            },
            districts: objResponse.data.filters.districts,
            pagination: {
                currentPage: objResponse.data.pagination.current_page,
                lastPage: objResponse.data.pagination.last_page,
                perPage: objResponse.data.pagination.per_page,
                total: objResponse.data.pagination.total,
                from: objResponse.data.pagination.from,
                to: objResponse.data.pagination.to,
            },
        };
    } catch (errOperation)
    {
        /* end try */

        reportError(
            errOperation,
            'setup_monitoring_store: fetch setup monitoring projects failed.',
        );
        throw errOperation;
    }
} /* end fetchSetupMonitoringProjects */

// ===========================================================================
// REAL QUARTERLY METRICS (GET /projects/{projectId}/quarterly-metrics)
// ===========================================================================
//
// Everything below replaces createDefaultQuarterRecord's fake Madayaway data
// with the actual backend payload, mapped onto SetupMonitoringQuarterRecord.
// createDefaultQuarterRecord/getQuarterRecord/saveQuarterRecord above are
// left untouched — keep them only if you still want a local-draft/demo path;
// otherwise you can delete createDefaultQuarterRecord once nothing references
// it.

function _getNumericValue(objValue: string | number | null | undefined): number
{
    if (objValue === null || objValue === undefined)
    {
        return 0;
    }
    const dblNumber = typeof objValue === 'number' ? objValue : parseFloat(objValue);
    return Number.isFinite(dblNumber) ? dblNumber : 0;
}

/** Quarter number to label. */
function _quarterNumberToLabel(intQuarter: number): Quarter
{
    return `Q${intQuarter}` as Quarter;
}

// REVERSE of toBackendSectoralGroup in quarterResourceAdapters.ts. Must be
// kept in sync with that mapping.
//
// 'Senior' -> 'SC' round-trips cleanly.
// 'PWD' -> 'PWD' round-trips cleanly.
// 'None' is ambiguous on the way back: it could be a genuine 'None', or it
// could be a former 'Youth' employee that got flattened to 'None' on write
// (see the DECISION note in employeeAdapter). There is no way to recover
// which one it was from this payload alone — the distinction was lost at
// write time. This always resolves to 'None', which means youthCount in
// computeEmploymentTotals will read 0 for any employee loaded from the
// backend, even ones that were originally tagged 'Youth' before their first
// save. If youth tracking needs to survive a round trip, sectoral_group
// needs a real 'Youth' value on the backend — flagging this again in case
// priorities change later, even though it's parked for now.
function _fromBackendSectoralGroup(
    strGroup: string | null | undefined,
): EmployeeItem['sectoralGroup']
{
    if (strGroup === 'Youth')
    {
        return 'Youth';
    }
    if (strGroup === 'Senior')
    {
        return 'SC';
    }
    if (strGroup === 'PWD')
    {
        return 'PWD';
    }
    return 'None';
}

/**
 * Maps a single backend quarterly-metrics record onto the frontend
 * SetupMonitoringQuarterRecord shape.
 *
 * KNOWN BACKEND MISMATCHES — these are heuristics, not real classifications.
 * Do not treat the resulting split (building/equipment, direct/indirect, etc.)
 * as authoritative; it exists so nothing from the API response is silently
 * dropped while the backend contract is still catching up to the frontend
 * model. Revisit each of these once the backend adds the missing column:
 *
 * 1. `asset` — no field distinguishes Building vs Equipment. We bucket by
 *    `type` containing "building" (case-insensitive); everything else is
 *    treated as Equipment.
 * 2. `market` — no field distinguishes International vs Local. Everything
 *    currently lands in `localMarkets` until the backend adds a
 *    classification column.
 * 3. `employees` — no DIRECT/INDIRECT classification. Everything currently
 *    lands in `directEmployees`; `indirectEmployees` stays empty.
 * 4. `linkage.type` is "forward" (distributor) vs "backward" (supplier).
 * 5. `product_cost` — no category (Operating / Labor / Misc). Everything
 *    currently lands in `operatingExpenses`; `laborExpenses` and
 *    `miscellaneousExpenses` stay empty until the backend adds a `category`
 *    column.
 * 6. `intervention.type` should route rows to Consultancy / Training / Tech
 *    Transfer / Support Service / Other Project. Only "CONSULTANCY" has been
 *    observed in sample data — unrecognized types fall back to Consultancy.
 * 7. `narrative` has no HR/Technical/Financial/Market breakdown. Known
 *    backend issue from rush coding — parked, not being fixed right now.
 *    All PROBLEMS-type rows are concatenated into
 *    `problemsAndActions.humanResource` and all PLANS-type rows into
 *    `plansForImprovement.humanResource` as a temporary holding spot.
 * 8. `enterpriseName` / `enterpriseAddress` are not part of this payload —
 *    pass them in via `overrides` from the already-loaded ProjectRecord
 *    (e.g. `project.enterprise`, `project.location`).
 * 9. `status` ('Draft' | 'Verified') and `dateOfVisit` are inferred from
 *    `submitted_at` since there's no dedicated field for either yet.
 * 10. `employees[].sectoral_group` — 'None' is ambiguous (see
 *     fromBackendSectoralGroup above); youth tagging does not survive a
 *     round trip through the backend.
 */
export function mapBackendQuarterlyMetric(
    strProjectId: string,
    objMetric: BackendQuarterlyMetric,
    objOverrides: Partial<
        Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
    > = {},
): SetupMonitoringQuarterRecord
{
    const strQuarter = _quarterNumberToLabel(objMetric.quarter);
    const intYear = objMetric.year;

    // --- Assets (heuristic building/equipment split, see note 1) ---
    const arrBuildingAssets: BuildingAsset[] = [];
    const arrEquipmentAssets: EquipmentAsset[] = [];
    for (const objLeft of objMetric.asset)
    {
        const curCost = _getNumericValue(objLeft.cost);
        const intUsefulLifeYears = objLeft.lifespan;
        const intYearAcquired = objLeft.year_acquired;
        const curDepreciation = _getNumericValue(objLeft.depreciation);
        const curBookValue = Math.max(
            0,
            Math.round((curCost - Math.max(0, intYear - intYearAcquired) * curDepreciation) * 100) /
            100,
        );

        const blnIsBuilding = /^building:/i.test(objLeft.type);
        // strip the "Building: " / "Equipment: " marker we stamp on save
        const strCleanType = objLeft.type.replace(/^(building|equipment):\s*/i, '');

        if (blnIsBuilding)
        {
            arrBuildingAssets.push({
                id: `asset_${objLeft.id}`,
                buildingName: objLeft.asset_name,
                buildingType: strCleanType,
                usefulLifeYears: intUsefulLifeYears,
                yearAcquired: intYearAcquired,
                cost: curCost,
                depreciation: curDepreciation,
                bookValue: curBookValue,
            });
        } else
        {
            arrEquipmentAssets.push({
                id: `asset_${objLeft.id}`,
                equipmentName: objLeft.asset_name,
                equipmentType: strCleanType,
                usefulLifeYears: intUsefulLifeYears,
                yearAcquired: intYearAcquired,
                cost: curCost,
                depreciation: curDepreciation,
                bookValue: curBookValue,
            });
        }
    } /* end loop */

    const arrWorkingCapital: WorkingCapitalItem[] = objMetric.asset_capital.map((objItem) => ({
        id: `wc_${objItem.id}`,
        particulars: objItem.name,
        amount: _getNumericValue(objItem.amount),
    }));

    const arrSales: ProductSalesItem[] = objMetric.products.map((objProduct) => ({
        id: `prod_${objProduct.id}`,
        productName: objProduct.product_name,
        specifications: objProduct.specifications,
        unit: objProduct.unit,
        sellingPrice: _getNumericValue(objProduct.price),
        quantity: objProduct.quantity,
        totalSales: _getNumericValue(objProduct.gross_sales),
    }));

    // --- Production cost (see note 5: now routed by `type`) ---
    const arrOperatingExpenses: MonthlyExpenseItem[] = [];
    const arrLaborExpenses: MonthlyExpenseItem[] = [];
    const arrMiscellaneousExpenses: MonthlyExpenseItem[] = [];

    for (const objItem of objMetric.product_cost)
    {
        const objMappedItem: MonthlyExpenseItem = {
            id: `pc_${objItem.id}`,
            particulars: objItem.particulars,
            month1: _getNumericValue(objItem.month_1),
            month2: _getNumericValue(objItem.month_2),
            month3: _getNumericValue(objItem.month_3),
            total: _getNumericValue(objItem.total),
        };
        if (objItem.type === 'LABOR')
        {
            arrLaborExpenses.push(objMappedItem);
        } else if (objItem.type === 'MISCELLANEOUS')
        {
            arrMiscellaneousExpenses.push(objMappedItem);
        } else
        {
            arrOperatingExpenses.push(objMappedItem);
        } // 'OPERATION' or unrecognized -> default bucket
    }

    const arrRawMaterials: RawMaterialItem[] = objMetric.production_material.map((objMaterial) => ({
        id: `pm_${objMaterial.id}`,
        rawMaterialName: objMaterial.materials,
        unit: objMaterial.unit,
        quantity: objMaterial.quantity,
        costPerUnit: _getNumericValue(objMaterial.cost),
        totalCost: _getNumericValue(objMaterial.total),
    }));

    // --- Employment (see note 3: everything lands in Direct for now) ---
    const arrEmployees: EmployeeItem[] = objMetric.employees.map((objEvent) => ({
        id: `emp_${objEvent.id}`,
        type: 'DIRECT',
        name: objEvent.employee_name,
        age: objEvent.age,
        employmentStatus: (objEvent.status as EmployeeItem['employmentStatus']) || 'Regular',
        sex: (objEvent.gender as EmployeeItem['sex']) || 'Male',
        sectoralGroup: _fromBackendSectoralGroup(
            objEvent.sectoral_classification ?? objEvent.sectoral_group,
        ),
        workdaysQuarter: objEvent.days_of_attendance,
        salaryType: 'Daily',
        salaryRate: _getNumericValue(objEvent.salary_rate),
        totalSalaryQuarter: _getNumericValue(objEvent.total_salary),
    }));
    const arrDirectEmployees = arrEmployees.filter(
        (_objUnused, intIndex) => objMetric.employees[intIndex]?.employment_type !== 'INDIRECT',
    );
    const arrIndirectEmployees = arrEmployees.filter(
        (_objUnused, intIndex) => objMetric.employees[intIndex]?.employment_type === 'INDIRECT',
    );

    // --- Interventions (see note 6: routed by `type`, default = Consultancy) ---
    const arrConsultancies: ConsultancyItem[] = [];
    const arrTrainings: TrainingItem[] = [];
    const arrTechTransfers: TechTransferItem[] = [];
    const arrSupportServices: SupportServiceItem[] = [];
    const arrOtherProjects: OtherDostProjectItem[] = [];

    for (const objIv of objMetric.intervention)
    {
        const strType = (objIv.type || '').toUpperCase();
        const blnAvailed = objIv.availed === '1' || objIv.availed?.toLowerCase() === 'true';
        const strInterventionDate = normalizeMonitoringDate(objIv.date, intYear) ?? '';

        if (strType.includes('TRAIN'))
        {
            arrTrainings.push({
                id: `tr_${objIv.id}`,
                category: 'OTHER',
                trainingName: objIv.name,
                date: strInterventionDate,
            });
        } else if (strType.includes('TECH'))
        {
            arrTechTransfers.push({
                id: `tt_${objIv.id}`,
                type: 'OTHER',
                details: objIv.intervention || objIv.name,
                date: strInterventionDate,
            });
        } else if (
            strType.includes('SUPPORT') ||
            strType.includes('TEST') ||
            strType.includes('CALIB')
        )
        {
            arrSupportServices.push({
                id: `ss_${objIv.id}`,
                type: 'Other',
                productTestedParameters: objIv.intervention || objIv.name,
                date: strInterventionDate,
            });
        } else if (strType.includes('OTHER') || strType.includes('PROJECT'))
        {
            arrOtherProjects.push({
                id: `op_${objIv.id}`,
                projectTitle: objIv.name,
                date: strInterventionDate,
            });
        } else
        {
            // "CONSULTANCY" and anything unrecognized
            arrConsultancies.push({
                id: `cons_${objIv.id}`,
                serviceName: objIv.name,
                availed: blnAvailed,
                areaOfIntervention: objIv.intervention,
                date: strInterventionDate,
            });
        }
    } /* end loop */

    // --- Linkages (routed by `type`, "forward" vs "backward") ---
    const arrForwardDistributors: WorkerCount[] = [];
    const arrForwardSuppliers: WorkerCount[] = [];
    for (const objItemValue of objMetric.linkage)
    {
        const objMappedItem: WorkerCount = {
            id: `link_${objItemValue.id}`,
            name: objItemValue.name,
            male: objItemValue.male_quantity,
            female: objItemValue.female_quantity,
            total: objItemValue.total,
        };
        if (/back/i.test(objItemValue.type))
        {
            arrForwardSuppliers.push(objMappedItem);
        } else
        {
            arrForwardDistributors.push(objMappedItem);
        }
    }

    // --- Markets (see note 2: everything lands in Local for now) ---
    const arrMarkets: MarketOutletItem[] = objMetric.market.map((objMarket) => ({
        id: `mkt_${objMarket.id}`,
        marketType: objMarket.market_type ?? 'LOCAL',
        marketName: objMarket.market_name,
        address: objMarket.address,
        condition: (objMarket.condition || '').toUpperCase() === 'NEW' ? 'NEW' : 'OLD',
        effectivityDate: normalizeMonitoringDate(objMarket.effective_date, intYear) ?? '',
        contactPerson: objMarket.contact_person,
        productServiceSold: objMarket.service,
        volumeDelivered: objMarket.volume,
    }));
    const arrLocalMarkets = arrMarkets.filter(
        (objMarket) => objMarket.marketType !== 'INTERNATIONAL',
    );
    const arrInternationalMarkets = arrMarkets.filter(
        (objMarket) => objMarket.marketType === 'INTERNATIONAL',
    );

    // --- Narratives (see note 7: known backend issue, parked for now) ---
    const strProblemsText = objMetric.narrative
        .filter((objNumber) => (objNumber.type || '').toUpperCase().includes('PROBLEM'))
        .map(
            (objNumber) =>
                `${objNumber.particular}${objNumber.intervention ? ` — Action: ${objNumber.intervention}` : ''}`,
        )
        .join('\n');
    const strPlansText = objMetric.narrative
        .filter((objNumber) => (objNumber.type || '').toUpperCase().includes('PLAN'))
        .map(
            (objNumber) =>
                `${objNumber.particular}${objNumber.intervention ? ` — Action: ${objNumber.intervention}` : ''}`,
        )
        .join('\n');

    const strVisitDate = objMetric.submitted_at ? objMetric.submitted_at.slice(0, 10) : '';

    return {
        id: `${strProjectId}-${intYear}-${strQuarter}`,
        projectId: strProjectId,
        enterpriseName: objOverrides.enterpriseName ?? '',
        enterpriseAddress: objOverrides.enterpriseAddress ?? '',
        year: intYear,
        quarter: strQuarter,
        dateOfVisit: strVisitDate,
        status: objMetric.submitted_at ? 'Verified' : 'Draft',
        buildingAssets: arrBuildingAssets,
        equipmentAssets: arrEquipmentAssets,
        workingCapital: arrWorkingCapital,
        internationalMarkets: arrInternationalMarkets,
        localMarkets: arrLocalMarkets,
        forwardDistributors: arrForwardDistributors,
        forwardSuppliers: arrForwardSuppliers,
        directEmployees: arrDirectEmployees,
        indirectEmployees: arrIndirectEmployees,
        consultancies: arrConsultancies,
        trainings: arrTrainings,
        techTransfers: arrTechTransfers,
        supportServices: arrSupportServices,
        otherProjects: arrOtherProjects,
        operatingExpenses: arrOperatingExpenses,
        laborExpenses: arrLaborExpenses,
        rawMaterials: arrRawMaterials,
        miscellaneousExpenses: arrMiscellaneousExpenses,
        sales: arrSales,
        problemsAndActions: {
            humanResource: strProblemsText,
            technical: '',
            financial: '',
            market: '',
        },
        plansForImprovement: {
            humanResource: strPlansText,
            technical: '',
            financial: '',
            market: '',
        },
        signOff: {
            interviewerName: '',
            interviewerDesignation: '',
            interviewerSignatureDate: '',
            respondentName: '',
            respondentDesignation: '',
            respondentSignatureDate: '',
            dateOfVisit: strVisitDate,
        },
    };
} /* end mapBackendQuarterlyMetric */

/**
 * Fetches real quarterly metrics for a project from
 * GET /projects/{projectId}/quarterly-metrics and returns the record for the
 * requested year/quarter. Falls back to an EMPTY record (not the
 * createDefaultQuarterRecord mock) if the backend has no data for that period
 * yet, so the UI never silently shows fabricated numbers.
 */
export async function fetchQuarterlyMetrics(
    strProjectId: string,
    intYear: number,
    strQuarter: Quarter,
    objOverrides: Partial<
        Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
    > = {},
): Promise<SetupMonitoringQuarterRecord>
{
    try
    {
        const objResponse = await g_objApi.get<BackendQuarterlyMetricsResponse>(
            `/projects/${strProjectId}/quarterly-metrics`,
            {
                params: {
                    quarter: Number(strQuarter.slice(1)),
                    year: intYear,
                },
            },
        );

        const intQuarterNumber = Number(strQuarter.replace('Q', ''));
        const objMatch = objResponse.data.data.find(
            (objItem) => objItem.quarter === intQuarterNumber && objItem.year === intYear,
        );

        if (!objMatch)
        {
            return _createEmptyQuarterRecord(strProjectId, intYear, strQuarter);
        }

        return mapBackendQuarterlyMetric(strProjectId, objMatch, objOverrides);
    } catch (errOperation)
    {
        reportError(errOperation, 'setup_monitoring_store: fetch quarterly metrics failed.');
        throw errOperation;
    }
} /* end fetchQuarterlyMetrics */

export interface QuarterlyMetricsFetchResult
{
    record: SetupMonitoringQuarterRecord;
    /**
     * Backend `quarterly_metrics.id` — required for every
     * /quarterly-metrics/{quarterId}/{resource}/batch call. `null` means no
     * row exists yet for this project/year/quarter combo. Call
     * `createQuarterlyMetric()` (below) to create one — that's what
     * `SetupMonitoringHub`'s "Create quarterly metrics" action does — then
     * re-fetch or set this id directly so autosave can start working.
     */
    quarterMetricId: number | null;
}

/** Fetch quarterly metrics with id. */
export async function fetchQuarterlyMetricsWithId(
    strProjectId: string,
    intYear: number,
    strQuarter: Quarter,
    objOverrides: Partial<
        Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
    > = {},
): Promise<QuarterlyMetricsFetchResult>
{
    try
    {
        const objResponse = await g_objApi.get<BackendQuarterlyMetricsResponse>(
            `/projects/${strProjectId}/quarterly-metrics`,
            {
                params: {
                    quarter: Number(strQuarter.slice(1)),
                    year: intYear,
                },
            },
        );

        const intQuarterNumber = Number(strQuarter.replace('Q', ''));
        const objMatch = objResponse.data.data.find(
            (objItem) => objItem.quarter === intQuarterNumber && objItem.year === intYear,
        );

        if (!objMatch)
        {
            return {
                record: _createEmptyQuarterRecord(strProjectId, intYear, strQuarter),
                quarterMetricId: null,
            };
        }

        return {
            record: mapBackendQuarterlyMetric(strProjectId, objMatch, objOverrides),
            quarterMetricId: objMatch.id,
        };
    } catch (errOperation)
    {
        /* end try */

        reportError(
            errOperation,
            'setup_monitoring_store: fetch quarterly metrics with id failed.',
        );
        throw errOperation;
    }
} /* end fetchQuarterlyMetricsWithId */

// ===========================================================================
// CREATE QUARTERLY METRICS ROW (POST /projects/{projectId}/quarterly-metrics)
// ===========================================================================
//
// This is the piece that was missing end-to-end: fetchQuarterlyMetricsWithId
// only ever GETs. When no row exists yet for the selected project/quarter/
// year, `quarterMetricId` comes back `null` and the hub has no way to start
// syncing — everything just sits in the local-draft/localStorage path
// forever. This calls the actual `store()` endpoint your
// StoreQuarterlyMetricsRequest validates against, so a real
// `quarterly_metrics` row gets created and its id can be used for the
// existing batch-sync endpoints immediately afterward.
//
// NOTE on `project_id` in the body: StoreQuarterlyMetricsRequest's unique
// rule reads `$this->input('project_id')`, but the route only supplies
// `{projectId}` as a URL segment — it is NOT automatically merged into the
// request body. Unless the controller does `$request->merge([...])`
// somewhere before validation runs, that closure evaluates against `null`
// project_id, which makes the per-project uniqueness check on
// (project_id, quarter, year) effectively a no-op. Sending `project_id`
// explicitly here is the frontend's only lever on this — the backend
// should also be checked/fixed to merge the route param in before validating.

export interface CreateQuarterlyMetricError
{
    message: string;
    errors?: Record<string, string[]>;
}

/**
 * Creates a brand-new (empty) quarterly_metrics row for the given project/
 * quarter/year via POST /projects/{projectId}/quarterly-metrics, and returns
 * its backend id. Throws on failure (422 validation — e.g. the quarter/year
 * combo already exists for this project — or any other API error); callers
 * should catch and surface `error.response?.data` as `CreateQuarterlyMetricError`.
 */
export async function createQuarterlyMetric(
    strProjectId: string,
    intYear: number,
    strQuarter: Quarter,
): Promise<number>
{
    try
    {
        const intQuarterNumber = Number(strQuarter.replace('Q', ''));

        const objResponse = await g_objApi.post<CreateQuarterlyMetricResponse>(
            `/projects/${strProjectId}/quarterly-metrics`,
            {
                // Route already scopes this to the project, but the FormRequest's
                // unique-rule closure reads project_id off the request body (see note
                // above), so it's included here too.
                project_id: Number(strProjectId),
                quarter: intQuarterNumber,
                year: intYear,
            },
        );

        return objResponse.data.data.id;
    } catch (errOperation)
    {
        reportError(errOperation, 'setup_monitoring_store: create quarterly metric failed.');
        throw errOperation;
    }
} /* end createQuarterlyMetric */

/**
 * Convenience wrapper: creates the quarterly_metrics row, then immediately
 * maps the (empty) response into a SetupMonitoringQuarterRecord + id, in the
 * same shape fetchQuarterlyMetricsWithId returns — so a caller can swap
 * straight from "no backend row" to "backend row ready to sync" without a
 * second round trip.
 */
export async function createQuarterlyMetricWithRecord(
    strProjectId: string,
    intYear: number,
    strQuarter: Quarter,
    objOverrides: Partial<
        Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>
    > = {},
): Promise<QuarterlyMetricsFetchResult>
{
    try
    {
        const intQuarterNumber = Number(strQuarter.replace('Q', ''));

        const objResponse = await g_objApi.post<CreateQuarterlyMetricResponse>(
            `/projects/${strProjectId}/quarterly-metrics`,
            {
                project_id: Number(strProjectId),
                quarter: intQuarterNumber,
                year: intYear,
            },
        );

        const objCreated = objResponse.data.data;

        return {
            record: mapBackendQuarterlyMetric(strProjectId, objCreated, objOverrides),
            quarterMetricId: objCreated.id,
        };
    } catch (errOperation)
    {
        reportError(
            errOperation,
            'setup_monitoring_store: create quarterly metric with record failed.',
        );
        throw errOperation;
    }
} /* end createQuarterlyMetricWithRecord */

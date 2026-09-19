/**
 * System: DPRMS
 * Purpose: Describe the current setup monitoring API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

export interface BackendSetupMonitoringProject
{
    id: number;
    proposal_id: number;
    reference_number: string;
    title: string;
    enterprise_name: string;
    proponent_name?: string | null;
    contact_number: string | null;
    industry_sector?: string | null;
    business_structure?: string | null;
    enterprise_size?: string | null;
    setup_funding: number;
    amount_refunded?: number;
    full_release: string | null;
    manager: string;
    focal_officer?: string | null;
    business_address: string | null;
    district: string | null;
    province: string | null;
    status: 'active';
    approved_at: string | null;
    start_date: string | null;
    expected_end_date: string | null;
    monitoring_status: string;
    overall_compliance: number;
    last_monitored_at: string | null;
    monitored: boolean;
    pending_reports: number;
    checklist_stats: {
        complied: number;
        total: number;
        percentage: number;
    };
    equipment_records?: Array<{
        id: string;
        equipment_name: string;
        year_acquired: number;
        useful_life_years: number;
        cost: number;
        book_value: number;
        condition: string;
        property_number?: string | null;
        serial_number?: string | null;
        brand?: string | null;
        model?: string | null;
        qr_reference?: string | null;
    }>;
    latest_report: {
        status: string;
        reporting_period: string;
        year: number;
        quarter: number | null;
        due_date: string | null;
    } | null;
}

export interface BackendSetupMonitoringResponse
{
    statistics: {
        active_projects: number;
        monitored_count: number;
        pending_reports: number;
    };
    filters: {
        districts: string[];
    };
    data: BackendSetupMonitoringProject[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
}

export interface BackendQuarterlyProductItem
{
    id: number;
    quarter_id: number;
    product_name: string;
    specifications: string;
    unit: string;
    price: string;
    quantity: number;
    gross_sales: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyEmployeeItem
{
    id: number;
    quarter_id: number;
    employee_name: string;
    age: number;
    status: string;
    gender: string;
    sectoral_group: string;
    sectoral_classification: string | null;
    employment_type: 'DIRECT' | 'INDIRECT';
    days_of_attendance: number;
    salary_rate: string;
    total_salary: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyProductCostItem
{
    id: number;
    quarter_id: number;
    particulars: string;
    type: 'OPERATION' | 'LABOR' | 'MISCELLANEOUS';
    month_1: string;
    month_2: string;
    month_3: string;
    total: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyAssetItem
{
    id: number;
    quarter_id: number;
    asset_name: string;
    type: string;
    lifespan: number;
    year_acquired: number;
    cost: string;
    depreciation: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyAssetCapitalItem
{
    id: number;
    quarter_id: number;
    name: string;
    amount: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyInterventionItem
{
    id: number;
    quarter_id: number;
    name: string;
    type: string;
    availed: string;
    intervention: string;
    date: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyLinkageItem
{
    id: number;
    quarter_id: number;
    name: string;
    type: string;
    male_quantity: number;
    female_quantity: number;
    total: number;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyMarketItem
{
    id: number;
    quarter_id: number;
    market_name: string;
    market_type: 'LOCAL' | 'INTERNATIONAL';
    address: string;
    condition: string;
    effective_date: string;
    contact_person: string;
    service: string;
    volume: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyNarrativeItem
{
    id: number;
    quarter_id: number;
    particular: string;
    type: string;
    intervention: string;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyProductionMaterialItem
{
    id: number;
    quarter_id: number;
    materials: string;
    unit: string;
    quantity: number;
    cost: number;
    total: number;
    created_at: string;
    updated_at: string;
}

export interface BackendQuarterlyMetric
{
    id: number;
    project_id: number;
    submitted_by: number;
    quarter: number;
    year: number;
    gross_sales: string;
    production_volume: number;
    employee_count: number;
    total_cost: string;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
    products: BackendQuarterlyProductItem[];
    employees: BackendQuarterlyEmployeeItem[];
    product_cost: BackendQuarterlyProductCostItem[];
    asset: BackendQuarterlyAssetItem[];
    asset_capital: BackendQuarterlyAssetCapitalItem[];
    intervention: BackendQuarterlyInterventionItem[];
    linkage: BackendQuarterlyLinkageItem[];
    market: BackendQuarterlyMarketItem[];
    narrative: BackendQuarterlyNarrativeItem[];
    production_material: BackendQuarterlyProductionMaterialItem[];
}

export interface BackendQuarterlyMetricsResponse
{
    message: string;
    data: BackendQuarterlyMetric[];
}

export interface CreateQuarterlyMetricResponse
{
    message: string;
    data: BackendQuarterlyMetric;
}

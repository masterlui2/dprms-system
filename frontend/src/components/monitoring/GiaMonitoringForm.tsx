/**
 * System: DPRMS
 * Purpose: Render gia monitoring form for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { reportError } from '../../utils/error_reporting';

import { formatCurrency, type ProjectRecord } from '../../data/admin';
import type {
    GiaAccomplishmentRow as AccomplishmentRow,
    GiaMonitoringFormData,
    GiaOutputRow as OutputRow,
} from '../../services/gia_monitoring_store';
import { cn } from '../../utils/cn';

interface GiaMonitoringFormProps
{
    objProject: ProjectRecord;
    onBack: () => void;
    blnHideTopBar?: boolean;
    blnReadOnly?: boolean;
    strSelectedReportingPeriod?: string;
    objInitialData?: GiaMonitoringFormData | null;
    blnIsSaving?: boolean;
    onSave?: (objData: GiaMonitoringFormData) => Promise<void>;
}

/** Render auto resize textarea and its available actions. */
function AutoResizeTextarea({
    value: strValue,
    onChange,
    className: strClassName = '',
    placeholder: strPlaceholder = '',
    intMinRows = 2,
}: {
    value: string;
    onChange: (strValueValue: string) => void;
    className?: string;
    placeholder?: string;
    intMinRows?: number;
})
{
    const objTextareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() =>
    {
        if (objTextareaRef.current)
        {
            objTextareaRef.current.style.height = 'auto';
            objTextareaRef.current.style.height = `${Math.max(objTextareaRef.current.scrollHeight, intMinRows * 20)}px`;
        }
    }, [strValue, intMinRows]);

    return (
        <textarea
            className={cn(
                'w-full resize-none overflow-hidden transition-none [field-sizing:content] focus:outline-none',
                strClassName,
            )}
            onChange={(objEvent) =>
            {
                if (objTextareaRef.current)
                {
                    objTextareaRef.current.style.height = 'auto';
                    objTextareaRef.current.style.height = `${Math.max(objTextareaRef.current.scrollHeight, intMinRows * 20)}px`;
                }
                onChange(objEvent.target.value);
            }}
            placeholder={strPlaceholder}
            ref={objTextareaRef}
            rows={intMinRows}
            value={strValue}
        />
    );
} /* end AutoResizeTextarea */

/** Render gia monitoring form and its available actions. */
export function GiaMonitoringForm({
    objProject,
    onBack,
    blnHideTopBar = false,
    blnReadOnly = false,
    strSelectedReportingPeriod,
    objInitialData = null,
    blnIsSaving = false,
    onSave,
}: GiaMonitoringFormProps)
{
    const objMon = (objProject as any)?.setupMonitoring;
    const blnIsSetup = objProject?.program === 'SETUP';
    const objGia = objProject?.gia;
    const blnIsBackendProject = objProject.backendId !== undefined;

    const strReportingPeriod =
        strSelectedReportingPeriod ||
        objGia?.reportingPeriod ||
        (blnIsSetup ? 'CY 2026 (Quarterly)' : '1st Semester 2026');
    const [strProjectLeaderGender, setStrProjectLeaderGender] = useState(
        objInitialData?.projectLeaderGender ??
        (blnIsBackendProject
            ? objProject.manager
            : objProject.manager
                ? `${objProject.manager} (M)`
                : objMon
                    ? `${objMon.assignedStaff?.split('(')[0]?.trim()} (M)`
                    : 'Dr. Kevin Lim (M)'),
    );
    const [strAgency, setStrAgency] = useState(
        objInitialData?.agency ?? objGia?.agency ?? objProject.enterprise,
    );
    const [strAddressContact, setStrAddressContact] = useState(
        objInitialData?.addressContact ??
        (blnIsBackendProject
            ? objProject.location || objGia?.location || ''
            : objGia?.location
                ? `${objGia.location} · 0917-123-4567 · info@dost.gov.ph`
                : objMon
                    ? `${objMon.pstoOffice}, Davao Oriental · 0917-888-2026 · enterprise@dost.gov.ph`
                    : 'Mati City, Davao Oriental · 0917-123-4567 · gia@dost.gov.ph'),
    );
    const [strCooperatingAgencies, setStrCooperatingAgencies] = useState(
        objInitialData?.cooperatingAgencies ??
        objGia?.cooperatingAgencies?.join(', ') ??
        (blnIsBackendProject ? '' : 'PSTO Davao Oriental, LGU Mati City'),
    );
    const [strBaseStation, setStrBaseStation] = useState(
        objInitialData?.baseStation ??
        objGia?.baseStation ??
        (objMon ? `${objMon.pstoOffice}, Mati City` : 'DOST PSTO Davao Oriental'),
    );
    const [strSitesOfImplementation, setStrSitesOfImplementation] = useState(
        objInitialData?.sitesOfImplementation ??
        objGia?.location ??
        (objMon ? `${objMon.pstoOffice}, Region XI` : 'Davao Oriental, Region XI'),
    );
    const [dblDurationMonths, setDblDurationMonths] = useState(
        objInitialData?.durationMonths ?? objGia?.durationMonths ?? (blnIsSetup ? 36 : 24),
    );
    const [strStartDate, setStrStartDate] = useState(
        objInitialData?.startDate ?? objGia?.startDate ?? 'Jan 15, 2025',
    );
    const [strEndDate, setStrEndDate] = useState(
        objInitialData?.endDate ?? objGia?.endDate ?? 'Jan 14, 2027',
    );
    const [curTotalBudget, setCurTotalBudget] = useState(
        objInitialData?.totalBudget ??
        (blnIsBackendProject
            ? objProject.budget
            : objProject.budget || (blnIsSetup ? 3500000 : 2500000)),
    );

    const [arrAccomplishments, setArrAccomplishments] = useState<AccomplishmentRow[]>(
        objInitialData
            ? objInitialData.accomplishments
            : objGia?.milestones?.length
                ? objGia.milestones.map((objMilestone) => ({
                    id: `acc_${objMilestone.id}`,
                    objective: `${objMilestone.number}. ${objMilestone.title}`,
                    objectiveWeight: Math.round(100 / objGia.milestones!.length),
                    activities: objMilestone.description || objMilestone.title,
                    targetAccomplishment: '100% milestone completion',
                    targetWeightY1: Math.round(100 / objGia.milestones!.length),
                    targetWeightY2: 0,
                    targetWeightY3: 0,
                    actualAccomplishment: `${objMilestone.completionPercentage}% complete`,
                    actualY1Percent: objMilestone.completionPercentage,
                    actualY2Percent: 0,
                    actualY3Percent: 0,
                    remarks: objMilestone.status.replaceAll('_', ' '),
                }))
                : blnIsBackendProject
                    ? []
                    : [
                        {
                            id: 'acc_1',
                            objective:
                                '1. Establish and validate community science & technology facility in target municipality.',
                            objectiveWeight: 35,
                            activities:
                                'Procurement of processing machinery, facility renovation, and trial test runs.',
                            targetAccomplishment:
                                'Fully operational processing line compliant with regional standards.',
                            targetWeightY1: 35,
                            targetWeightY2: 0,
                            targetWeightY3: 0,
                            actualAccomplishment:
                                'Machinery delivered, installed, and validated by regional technical inspectorate.',
                            actualY1Percent: 85,
                            actualY2Percent: 0,
                            actualY3Percent: 0,
                            remarks: 'Calibrated and accepted by inspectorate.',
                        },
                        {
                            id: 'acc_2',
                            objective:
                                '2. Capacity building and technical training of beneficiary operators and local personnel.',
                            objectiveWeight: 25,
                            activities:
                                'GMP, Food Safety, machine preventive maintenance, and digital inventory workshops.',
                            targetAccomplishment: '40 community operators trained and certified.',
                            targetWeightY1: 25,
                            targetWeightY2: 0,
                            targetWeightY3: 0,
                            actualAccomplishment:
                                '25 community operators certified across 2 training modules.',
                            actualY1Percent: 70,
                            actualY2Percent: 0,
                            actualY3Percent: 0,
                            remarks: 'Batch 2 training scheduled next quarter.',
                        },
                        {
                            id: 'acc_3',
                            objective:
                                '3. Formulate municipal adoption policy and sustainable operations turnover plan.',
                            objectiveWeight: 20,
                            activities:
                                'Draft Sangguniang Bayan resolution and MOA with beneficiary cooperative.',
                            targetAccomplishment:
                                '1 SB Resolution enacted and approved turnover framework.',
                            targetWeightY1: 20,
                            targetWeightY2: 0,
                            targetWeightY3: 0,
                            actualAccomplishment:
                                'Drafted resolution submitted to Municipal Committee on Science and Technology.',
                            actualY1Percent: 60,
                            actualY2Percent: 0,
                            actualY3Percent: 0,
                            remarks: 'Under second reading at SB council.',
                        },
                        {
                            id: 'acc_4',
                            objective:
                                '4. Semi-Annual Fund Liquidation, Audit, and Technical Reporting.',
                            objectiveWeight: 20,
                            activities:
                                'Preparation of financial statements, disbursement vouchers, and Form 10 filings.',
                            targetAccomplishment:
                                '100% timely liquidation submissions with zero COA audit findings.',
                            targetWeightY1: 20,
                            targetWeightY2: 0,
                            targetWeightY3: 0,
                            actualAccomplishment:
                                'Tranche 1 liquidated with PSTO accounting endorsement.',
                            actualY1Percent: 90,
                            actualY2Percent: 0,
                            actualY3Percent: 0,
                            remarks: 'Audit compliance certified clean.',
                        },
                    ],
    );

    const [strCatchUpPlan, setStrCatchUpPlan] = useState(
        objInitialData?.catchUpPlan ??
        objGia?.catchUpPlan ??
        (blnIsBackendProject
            ? ''
            : '1. Acceleration of remaining training schedules for Batch 2 operators within Q4.\n2. Coordinated follow-up with the Sangguniang Bayan Secretariat for the 2nd reading of the adoption ordinance.\n3. Conduct on-site technical inspection for commercial pilot run in coordination with PSTO Davao Oriental.'),
    );

    const [arrOutputs, setArrOutputs] = useState<OutputRow[]>(
        objInitialData
            ? objInitialData.outputs
            : objGia?.outputs.length
                ? objGia.outputs.map((objOutput, intIndex) => ({
                    id: `out_${intIndex + 1}`,
                    category: objOutput.category,
                    targetY1: objOutput.target,
                    targetY2: 0,
                    targetY3: 0,
                    actualFigureY1: objOutput.actual,
                    actualDescY1: objOutput.description,
                    actualFigureY2: 0,
                    actualDescY2: '',
                    actualFigureY3: 0,
                    actualDescY3: '',
                }))
                : blnIsBackendProject
                    ? []
                    : [
                        {
                            id: 'out_1',
                            category: '1. Publications (P1)',
                            targetY1: 2,
                            targetY2: 1,
                            targetY3: 0,
                            actualFigureY1: 1,
                            actualDescY1:
                                '1 Technical progress article prepared and submitted to DOST Region XI Newsletter.',
                            actualFigureY2: 0,
                            actualDescY2: '',
                            actualFigureY3: 0,
                            actualDescY3: '',
                        },
                        {
                            id: 'out_2',
                            category: '2. Patents / Intellectual Property (P2)',
                            targetY1: 1,
                            targetY2: 0,
                            targetY3: 0,
                            actualFigureY1: 0,
                            actualDescY1:
                                'Trademark application filed for community brand under IPO Philippines registration.',
                            actualFigureY2: 0,
                            actualDescY2: '',
                            actualFigureY3: 0,
                            actualDescY3: '',
                        },
                        {
                            id: 'out_3',
                            category: '3. Products / Commercialized Technologies (P3)',
                            targetY1: 3,
                            targetY2: 2,
                            targetY3: 0,
                            actualFigureY1: 2,
                            actualDescY1:
                                '2 Standardized community products packaged with DOST nutrition label design.',
                            actualFigureY2: 0,
                            actualDescY2: '',
                            actualFigureY3: 0,
                            actualDescY3: '',
                        },
                        {
                            id: 'out_4',
                            category: '4. People Services / Beneficiaries Trained (P4)',
                            targetY1: 120,
                            targetY2: 80,
                            targetY3: 0,
                            actualFigureY1: 85,
                            actualDescY1:
                                '85 community members and MSME staff trained in food safety, machine operations, and digital ledger.',
                            actualFigureY2: 0,
                            actualDescY2: '',
                            actualFigureY3: 0,
                            actualDescY3: '',
                        },
                        {
                            id: 'out_5',
                            category: '5. Places and Partnerships / LGUs Engaged (P5)',
                            targetY1: 4,
                            targetY2: 2,
                            targetY3: 0,
                            actualFigureY1: 3,
                            actualDescY1:
                                '3 Barangays covered under active deployment with MOA signed by Municipal Mayor.',
                            actualFigureY2: 0,
                            actualDescY2: '',
                            actualFigureY3: 0,
                            actualDescY3: '',
                        },
                        {
                            id: 'out_6',
                            category: '6. Policies Adopted (P6)',
                            targetY1: 1,
                            targetY2: 1,
                            targetY3: 0,
                            actualFigureY1: 1,
                            actualDescY1:
                                '1 Barangay Council Resolution adopting community facility guidelines enacted.',
                            actualFigureY2: 0,
                            actualDescY2: '',
                            actualFigureY3: 0,
                            actualDescY3: '',
                        },
                    ],
    );

    const [strProblemConcern, setStrProblemConcern] = useState(
        objInitialData?.problemConcern ??
        objGia?.issueSummary ??
        (blnIsBackendProject
            ? ''
            : '1. Intermittent power fluctuations at the community processing site causing slight delay in machinery calibration.\n2. Delays in raw material deliveries from upstream farming sitios due to heavy monsoon rains.'),
    );
    const [strSuggestedSolution, setStrSuggestedSolution] = useState(
        objInitialData?.suggestedSolution ??
        objGia?.suggestedSolution ??
        (blnIsBackendProject
            ? ''
            : '1. PSTO coordinated with Local Electric Cooperative (DORECO) for dedicated phase line and voltage regulator installation.\n2. Established buffer inventory storage schedule at the central processing hub.'),
    );

    const [strPreparedBy, setStrPreparedBy] = useState(
        objInitialData?.preparedBy ??
        objProject.manager ??
        (blnIsBackendProject ? '' : 'Dr. Kevin Lim'),
    );
    const [strReviewedBy, setStrReviewedBy] = useState(
        objInitialData?.reviewedBy ??
        (blnIsBackendProject ? '' : 'PSTD Officer, DOST PSTO Davao Oriental'),
    );
    const [strApprovedBy, setStrApprovedBy] = useState(
        objInitialData?.approvedBy ??
        (blnIsBackendProject ? '' : 'Dr. Anthony C. Sales, CESO III / Regional Director'),
    );

    /** Handle add accomplishment. */
    const _handleAddAccomplishment = () =>
    {
        const objNewAcc: AccomplishmentRow = {
            id: `acc_${Date.now()}`,
            objective: 'New Project Objective',
            objectiveWeight: 10,
            activities: 'Planned operational activities',
            targetAccomplishment: 'Target milestone output',
            targetWeightY1: 10,
            targetWeightY2: 0,
            targetWeightY3: 0,
            actualAccomplishment: 'Actual accomplishment description',
            actualY1Percent: 0,
            actualY2Percent: 0,
            actualY3Percent: 0,
            remarks: '',
        };
        setArrAccomplishments([...arrAccomplishments, objNewAcc]);
    };

    /** Handle delete accomplishment. */
    const _handleDeleteAccomplishment = (strId: string) =>
    {
        setArrAccomplishments(arrAccomplishments.filter((objLeft) => objLeft.id !== strId));
    };

    /** Handle add output. */
    const _handleAddOutput = () =>
    {
        const objNewOut: OutputRow = {
            id: `out_${Date.now()}`,
            category: 'New 6Ps Deliverable',
            targetY1: 1,
            targetY2: 0,
            targetY3: 0,
            actualFigureY1: 0,
            actualDescY1: '',
            actualFigureY2: 0,
            actualDescY2: '',
            actualFigureY3: 0,
            actualDescY3: '',
        };
        setArrOutputs([...arrOutputs, objNewOut]);
    };

    /** Handle delete output. */
    const _handleDeleteOutput = (strId: string) =>
    {
        setArrOutputs(arrOutputs.filter((objO) => objO.id !== strId));
    };

    const intComputedTargetTotal = arrAccomplishments.reduce(
        (intSum, objRecord) => intSum + (objRecord.targetWeightY1 || 0),
        0,
    );
    const intComputedWeightedTotal = arrAccomplishments.reduce((intSum, objRecord) =>
    {
        return intSum + ((objRecord.targetWeightY1 || 0) * (objRecord.actualY1Percent || 0)) / 100;
    }, 0);

    const intTotalSixpTargetYOne = arrOutputs.reduce(
        (intItem, objO) => intItem + (objO.targetY1 || 0),
        0,
    );
    const intTotalSixpActualYOne = arrOutputs.reduce(
        (intItem, objO) => intItem + (objO.actualFigureY1 || 0),
        0,
    );
    const intPctSixpYOne =
        intTotalSixpTargetYOne > 0
            ? Math.round((intTotalSixpActualYOne / intTotalSixpTargetYOne) * 100)
            : 0;

    /** Handle save. */
    const _handleSave = async () =>
    {
        try
        {
            if (!onSave || blnReadOnly || blnIsSaving)
            {
                return;
            }

            await onSave({
                projectLeaderGender: strProjectLeaderGender,
                agency: strAgency,
                addressContact: strAddressContact,
                cooperatingAgencies: strCooperatingAgencies,
                baseStation: strBaseStation,
                sitesOfImplementation: strSitesOfImplementation,
                durationMonths: dblDurationMonths,
                startDate: strStartDate,
                endDate: strEndDate,
                totalBudget: curTotalBudget,
                accomplishments: arrAccomplishments,
                catchUpPlan: strCatchUpPlan,
                outputs: arrOutputs,
                problemConcern: strProblemConcern,
                suggestedSolution: strSuggestedSolution,
                preparedBy: strPreparedBy,
                reviewedBy: strReviewedBy,
                approvedBy: strApprovedBy,
            });
        } catch (errOperation)
        {
            /* end try */

            reportError(errOperation, 'GiaMonitoringForm: handle save failed.');
            throw errOperation;
        }
    }; /* end _handleSave */

    return (
        <div className="w-full space-y-6 font-sans text-slate-900">
            {!blnHideTopBar && (
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] bg-[#E6EEF4]/50 text-[#285497] transition hover:bg-[#E6EEF4] hover:text-[#285497]"
                                onClick={onBack}
                                title="Back to monitored projects"
                                type="button"
                            >
                                <ArrowLeft className="size-5" />
                            </button>

                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                        {objProject.enterprise || objProject.title}
                                    </h1>
                                    <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-bold text-[#285497]">
                                        {objProject.id}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                    DOST-GIA Form 10 ·{' '}
                                    <span className="text-[#285497] font-bold">
                                        Executive Summary of Technical Progress Report
                                    </span>{' '}
                                    · {strReportingPeriod}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497]"
                                onClick={_handleSave}
                                disabled={blnReadOnly || blnIsSaving || !onSave}
                                type="button"
                            >
                                <Save className="size-3.5 text-[#285497]" />
                                <span>{blnIsSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <fieldset
                disabled={blnReadOnly}
                className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden print:border-none print:shadow-none disabled:opacity-100"
            >
                <div className="p-6 sm:p-8 space-y-8 text-xs text-slate-900">
                    <div className="border border-[#B5BFCD] divide-y divide-[#B5BFCD] rounded-xl overflow-hidden bg-white">
                        <div className="p-4 space-y-3.5 bg-[#E6EEF4]/20">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <span className="md:col-span-3 font-bold text-slate-700 text-xs">
                                    (1) Program Title:
                                </span>
                                <span className="md:col-span-9 font-bold text-[#285497] text-xs">
                                    {blnIsSetup
                                        ? 'Small Enterprise Technology Upgrading Program (DOST-SETUP)'
                                        : 'Grants-in-Aid (DOST-GIA) Program'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <span className="md:col-span-3 font-bold text-slate-700 text-xs">
                                    Project Title:
                                </span>
                                <span className="md:col-span-9 font-bold text-slate-900 text-xs">
                                    {objProject.title}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <span className="md:col-span-3 font-bold text-slate-700 text-xs">
                                    Project Leader / Gender:
                                </span>
                                <input
                                    className="md:col-span-3 h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) =>
                                        setStrProjectLeaderGender(objEvent.target.value)
                                    }
                                    placeholder="e.g. Engr. Juan Dela Cruz (M)"
                                    value={strProjectLeaderGender}
                                />
                                <span className="md:col-span-2 font-bold text-slate-700 md:text-right text-xs">
                                    Agency:
                                </span>
                                <input
                                    className="md:col-span-4 h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) => setStrAgency(objEvent.target.value)}
                                    value={strAgency}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <span className="md:col-span-3 font-bold text-slate-700 text-xs">
                                    Address / Contact / Email:
                                </span>
                                <AutoResizeTextarea
                                    className="md:col-span-9 rounded-lg border border-[#B5BFCD] bg-white p-2 font-normal text-slate-800 focus:border-[#0f53b7] text-xs"
                                    intMinRows={1}
                                    onChange={setStrAddressContact}
                                    placeholder="Address / Contact details / Email..."
                                    value={strAddressContact}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <span className="md:col-span-3 font-bold text-slate-700 text-xs">
                                    (2) Cooperating Agency/ies:
                                </span>
                                <input
                                    className="md:col-span-9 h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) =>
                                        setStrCooperatingAgencies(objEvent.target.value)
                                    }
                                    value={strCooperatingAgencies}
                                />
                            </div>
                        </div>

                        <div className="p-4 space-y-3 bg-[#E6EEF4]/20">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <span className="md:col-span-3 font-bold text-slate-700 text-xs">
                                    (3) Site/s of Implementation:
                                </span>
                                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        className="h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                        onChange={(objEvent) =>
                                            setStrBaseStation(objEvent.target.value)
                                        }
                                        placeholder="Base Station..."
                                        value={strBaseStation}
                                    />
                                    <input
                                        className="h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                        onChange={(objEvent) =>
                                            setStrSitesOfImplementation(objEvent.target.value)
                                        }
                                        placeholder="Field implementation sites..."
                                        value={strSitesOfImplementation}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#B5BFCD] bg-white">
                            <div className="p-4 flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-700 text-xs">
                                    (4) Project Duration (Months):
                                </span>
                                <input
                                    className="h-8 w-20 rounded-lg border border-[#B5BFCD] bg-white px-2 text-right font-bold text-slate-900 focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) =>
                                        setDblDurationMonths(Number(objEvent.target.value) || 0)
                                    }
                                    type="number"
                                    value={dblDurationMonths}
                                />
                            </div>
                            <div className="p-4 flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-700 text-xs">
                                    (5) Project Start Date:
                                </span>
                                <input
                                    className="h-8 w-32 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) => setStrStartDate(objEvent.target.value)}
                                    value={strStartDate}
                                />
                            </div>
                            <div className="p-4 flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-700 text-xs">
                                    (6) Project End Date:
                                </span>
                                <input
                                    className="h-8 w-32 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) => setStrEndDate(objEvent.target.value)}
                                    value={strEndDate}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#B5BFCD] bg-[#E6EEF4]/20">
                            <div className="p-4">
                                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                                    (7) Total Project Budget
                                </span>
                                <input
                                    className="mt-1 h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-mono font-bold text-[#285497] focus:border-[#0f53b7] text-xs focus:outline-none"
                                    onChange={(objEvent) =>
                                        setCurTotalBudget(Number(objEvent.target.value) || 0)
                                    }
                                    type="number"
                                    value={curTotalBudget}
                                />
                            </div>
                            <div className="p-4">
                                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                                    Year 1 (40%)
                                </span>
                                <p className="mt-1.5 font-mono font-bold text-slate-900 text-xs">
                                    {formatCurrency(curTotalBudget * 0.4)}
                                </p>
                            </div>
                            <div className="p-4">
                                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                                    Year 2 (40%)
                                </span>
                                <p className="mt-1.5 font-mono font-bold text-slate-900 text-xs">
                                    {formatCurrency(curTotalBudget * 0.4)}
                                </p>
                            </div>
                            <div className="p-4">
                                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                                    Year 3 (20%)
                                </span>
                                <p className="mt-1.5 font-mono font-bold text-slate-900 text-xs">
                                    {formatCurrency(curTotalBudget * 0.2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#B5BFCD] pb-2">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                    A. ACTUAL ACCOMPLISHMENT OF THE PROJECT (VIS-A-VIS OBJECTIVES)
                                </h3>
                                <p className="text-[11px] text-slate-500 font-normal">
                                    Sections (8) to (16) · Specific Project Objectives, Activities,
                                    and Technical Accomplishments
                                </p>
                            </div>
                            <button
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#B5BFCD] bg-white px-3 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                                onClick={_handleAddAccomplishment}
                                type="button"
                            >
                                <Plus className="size-3.5 text-[#285497]" />
                                <span>Add Row</span>
                            </button>
                        </div>

                        <div className="border border-[#B5BFCD] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                                    <tr>
                                        <th className="py-3 px-3 w-[18%]">Objectives (8)</th>
                                        <th className="py-3 px-3 w-[18%]">Activities</th>
                                        <th className="py-3 px-3 w-[18%]">
                                            Target Accomplishments (9)
                                        </th>
                                        <th className="py-3 px-2 text-right w-14">Weight % (10)</th>
                                        <th className="py-3 px-3 w-[18%]">
                                            Actual Accomplishments (11)
                                        </th>
                                        <th className="py-3 px-2 text-right w-14">Actual % (12)</th>
                                        <th className="py-3 px-2 text-right w-16">
                                            Weighted % (13)
                                        </th>
                                        <th className="py-3 px-2 text-right w-16">Cumulative %</th>
                                        <th className="py-3 px-2 w-10 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5BFCD]/40 text-slate-800 bg-white">
                                    {arrAccomplishments.map(
                                        (objRow) =>
                                        {
                                            const intWeightedYOne =
                                                (objRow.targetWeightY1 * objRow.actualY1Percent) /
                                                100;
                                            return (
                                                <tr
                                                    className="hover:bg-[#E6EEF4]/20 transition-colors"
                                                    key={objRow.id}
                                                >
                                                    <td className="p-2.5">
                                                        <AutoResizeTextarea
                                                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                                                            intMinRows={2}
                                                            onChange={(strValue) =>
                                                            {
                                                                setArrAccomplishments(
                                                                    arrAccomplishments.map(
                                                                        (objLeft) =>
                                                                            objLeft.id === objRow.id
                                                                                ? {
                                                                                    ...objLeft,
                                                                                    objective:
                                                                                        strValue,
                                                                                }
                                                                                : objLeft,
                                                                    ),
                                                                );
                                                            }}
                                                            placeholder="Objective..."
                                                            value={objRow.objective}
                                                        />
                                                    </td>
                                                    <td className="p-2.5">
                                                        <AutoResizeTextarea
                                                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                                                            intMinRows={2}
                                                            onChange={(strValue) =>
                                                            {
                                                                setArrAccomplishments(
                                                                    arrAccomplishments.map(
                                                                        (objLeft) =>
                                                                            objLeft.id === objRow.id
                                                                                ? {
                                                                                    ...objLeft,
                                                                                    activities:
                                                                                        strValue,
                                                                                }
                                                                                : objLeft,
                                                                    ),
                                                                );
                                                            }}
                                                            placeholder="Activities..."
                                                            value={objRow.activities}
                                                        />
                                                    </td>
                                                    <td className="p-2.5">
                                                        <AutoResizeTextarea
                                                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                                                            intMinRows={2}
                                                            onChange={(strValue) =>
                                                            {
                                                                setArrAccomplishments(
                                                                    arrAccomplishments.map(
                                                                        (objLeft) =>
                                                                            objLeft.id === objRow.id
                                                                                ? {
                                                                                    ...objLeft,
                                                                                    targetAccomplishment:
                                                                                        strValue,
                                                                                }
                                                                                : objLeft,
                                                                    ),
                                                                );
                                                            }}
                                                            placeholder="Target indicators..."
                                                            value={objRow.targetAccomplishment}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        <input
                                                            className="h-8 w-12 ml-auto rounded-lg border border-[#B5BFCD] bg-white p-1 text-right font-mono font-bold text-slate-900 focus:border-[#0f53b7] text-xs focus:outline-none"
                                                            onChange={(objEvent) =>
                                                            {
                                                                const intValue =
                                                                    Number(objEvent.target.value) ||
                                                                    0;
                                                                setArrAccomplishments(
                                                                    arrAccomplishments.map(
                                                                        (objLeft) =>
                                                                            objLeft.id === objRow.id
                                                                                ? {
                                                                                    ...objLeft,
                                                                                    targetWeightY1:
                                                                                        intValue,
                                                                                }
                                                                                : objLeft,
                                                                    ),
                                                                );
                                                            }}
                                                            type="number"
                                                            value={objRow.targetWeightY1}
                                                        />
                                                    </td>
                                                    <td className="p-2.5">
                                                        <AutoResizeTextarea
                                                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                                                            intMinRows={2}
                                                            onChange={(strValue) =>
                                                            {
                                                                setArrAccomplishments(
                                                                    arrAccomplishments.map(
                                                                        (objLeft) =>
                                                                            objLeft.id === objRow.id
                                                                                ? {
                                                                                    ...objLeft,
                                                                                    actualAccomplishment:
                                                                                        strValue,
                                                                                }
                                                                                : objLeft,
                                                                    ),
                                                                );
                                                            }}
                                                            placeholder="Actual accomplishments..."
                                                            value={objRow.actualAccomplishment}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        <input
                                                            className="h-8 w-12 ml-auto rounded-lg border border-[#B5BFCD] bg-white p-1 text-right font-mono font-bold text-[#285497] focus:border-[#0f53b7] text-xs focus:outline-none"
                                                            onChange={(objEvent) =>
                                                            {
                                                                const intValue =
                                                                    Number(objEvent.target.value) ||
                                                                    0;
                                                                setArrAccomplishments(
                                                                    arrAccomplishments.map(
                                                                        (objLeft) =>
                                                                            objLeft.id === objRow.id
                                                                                ? {
                                                                                    ...objLeft,
                                                                                    actualY1Percent:
                                                                                        intValue,
                                                                                }
                                                                                : objLeft,
                                                                    ),
                                                                );
                                                            }}
                                                            type="number"
                                                            value={objRow.actualY1Percent}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-right font-mono font-semibold text-[#285497]">
                                                        {intWeightedYOne.toFixed(1)}%
                                                    </td>
                                                    <td className="p-2 text-right font-mono font-semibold text-slate-900">
                                                        {intWeightedYOne.toFixed(1)}%
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                                            onClick={() =>
                                                                _handleDeleteAccomplishment(
                                                                    objRow.id,
                                                                )
                                                            }
                                                            title="Delete Objective Row"
                                                            type="button"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ); // end return
                                        } /* end GiaMonitoringForm */,
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-[#E6EEF4]/60 font-bold text-slate-900 border-t border-[#B5BFCD]">
                                        <td className="py-3 px-3 text-right" colSpan={3}>
                                            (14) Yearly Target / (15) Actual Accomplishment Totals:
                                        </td>
                                        <td className="py-3 px-2 text-right font-mono text-xs font-semibold text-[#285497]">
                                            {intComputedTargetTotal}%
                                        </td>
                                        <td className="py-3 px-3" />
                                        <td className="py-3 px-2 text-right font-mono text-xs font-semibold text-[#285497]">
                                            {intComputedWeightedTotal.toFixed(1)}%
                                        </td>
                                        <td
                                            className="py-3 px-2 text-right font-mono text-xs font-semibold text-slate-900"
                                            colSpan={2}
                                        >
                                            {intComputedWeightedTotal.toFixed(1)}%
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="border-b border-[#B5BFCD] pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                B. CATCH-UP PLAN (17)
                            </h3>
                            <p className="text-[11px] text-slate-500 font-normal">
                                Operational catch-up activities and adjustments for milestones
                            </p>
                        </div>
                        <div className="border border-[#B5BFCD] rounded-xl p-4 bg-white">
                            <AutoResizeTextarea
                                className="rounded-lg border border-[#B5BFCD] bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#0f53b7] font-normal"
                                intMinRows={3}
                                onChange={setStrCatchUpPlan}
                                placeholder="Enter details of catch-up activities..."
                                value={strCatchUpPlan}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#B5BFCD] pb-2">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                    C. EXPECTED OUTPUTS / 6PS (18 - 23)
                                </h3>
                                <p className="text-[11px] text-slate-500 font-normal">
                                    6Ps Deliverables (Publications, Patents/IP, Products, People
                                    Services, Places & Partnerships, Policies)
                                </p>
                            </div>
                            <button
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#B5BFCD] bg-white px-3 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                                onClick={_handleAddOutput}
                                type="button"
                            >
                                <Plus className="size-3.5 text-[#285497]" />
                                <span>Add Row</span>
                            </button>
                        </div>

                        <div className="border border-[#B5BFCD] rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                                    <tr>
                                        <th className="py-3 px-3 w-[26%]">
                                            Expected Outputs / Category (18)
                                        </th>
                                        <th className="py-3 px-2 text-right w-20">Target (19)</th>
                                        <th className="py-3 px-2 text-right w-20">Actual (20)</th>
                                        <th className="py-3 px-3 w-[45%]">
                                            Accomplishment Description (22)
                                        </th>
                                        <th className="py-3 px-2 w-10 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5BFCD]/40 text-slate-800 bg-white">
                                    {arrOutputs.map((objOut) => (
                                        <tr
                                            className="hover:bg-[#E6EEF4]/20 transition-colors"
                                            key={objOut.id}
                                        >
                                            <td className="p-2.5">
                                                <AutoResizeTextarea
                                                    className="rounded-lg border border-[#B5BFCD] bg-white p-2 font-normal text-slate-800 focus:border-[#0f53b7] text-xs"
                                                    intMinRows={1}
                                                    onChange={(strValue) =>
                                                    {
                                                        setArrOutputs(
                                                            arrOutputs.map((objO) =>
                                                                objO.id === objOut.id
                                                                    ? {
                                                                        ...objO,
                                                                        category: strValue,
                                                                    }
                                                                    : objO,
                                                            ),
                                                        );
                                                    }}
                                                    placeholder="6Ps Deliverable Category..."
                                                    value={objOut.category}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    className="h-8 w-14 ml-auto rounded-lg border border-[#B5BFCD] bg-white p-1 text-right font-mono font-bold text-slate-900 focus:border-[#0f53b7] text-xs focus:outline-none"
                                                    onChange={(objEvent) =>
                                                    {
                                                        const intValue =
                                                            Number(objEvent.target.value) || 0;
                                                        setArrOutputs(
                                                            arrOutputs.map((objO) =>
                                                                objO.id === objOut.id
                                                                    ? {
                                                                        ...objO,
                                                                        targetY1: intValue,
                                                                    }
                                                                    : objO,
                                                            ),
                                                        );
                                                    }}
                                                    type="number"
                                                    value={objOut.targetY1}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    className="h-8 w-14 ml-auto rounded-lg border border-[#B5BFCD] bg-white p-1 text-right font-mono font-bold text-[#285497] focus:border-[#0f53b7] text-xs focus:outline-none"
                                                    onChange={(objEvent) =>
                                                    {
                                                        const intValue =
                                                            Number(objEvent.target.value) || 0;
                                                        setArrOutputs(
                                                            arrOutputs.map((objO) =>
                                                                objO.id === objOut.id
                                                                    ? {
                                                                        ...objO,
                                                                        actualFigureY1: intValue,
                                                                    }
                                                                    : objO,
                                                            ),
                                                        );
                                                    }}
                                                    type="number"
                                                    value={objOut.actualFigureY1}
                                                />
                                            </td>
                                            <td className="p-2.5">
                                                <AutoResizeTextarea
                                                    className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs text-slate-800 font-normal focus:border-[#0f53b7] leading-relaxed"
                                                    intMinRows={1}
                                                    onChange={(strValue) =>
                                                    {
                                                        setArrOutputs(
                                                            arrOutputs.map((objO) =>
                                                                objO.id === objOut.id
                                                                    ? {
                                                                        ...objO,
                                                                        actualDescY1: strValue,
                                                                    }
                                                                    : objO,
                                                            ),
                                                        );
                                                    }}
                                                    placeholder="Description of accomplishments..."
                                                    value={objOut.actualDescY1}
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                                    onClick={() => _handleDeleteOutput(objOut.id)}
                                                    title="Delete Output Row"
                                                    type="button"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-[#E6EEF4]/60 font-bold text-slate-900 border-t border-[#B5BFCD]">
                                        <td className="py-3 px-3 text-right">
                                            (21) Overall 6Ps Deliverables Progress:
                                        </td>
                                        <td className="py-3 px-2 text-right font-mono text-xs font-semibold text-slate-900">
                                            {intTotalSixpTargetYOne}
                                        </td>
                                        <td className="py-3 px-2 text-right font-mono text-xs font-semibold text-[#285497]">
                                            {intTotalSixpActualYOne}
                                        </td>
                                        <td
                                            className="py-3 px-3 font-semibold text-slate-700"
                                            colSpan={2}
                                        >
                                            Accomplishment Rate:{' '}
                                            <strong className="text-[#285497] font-mono font-bold">
                                                {intPctSixpYOne}%
                                            </strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="border border-[#B5BFCD] rounded-xl overflow-hidden bg-white">
                            <div className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#285497]">
                                (24) PROBLEMS / CONCERNS
                            </div>
                            <div className="p-4">
                                <AutoResizeTextarea
                                    className="rounded-lg border border-[#B5BFCD] bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#0f53b7] font-normal"
                                    intMinRows={3}
                                    onChange={setStrProblemConcern}
                                    placeholder="State obstacles met..."
                                    value={strProblemConcern}
                                />
                            </div>
                        </div>

                        <div className="border border-[#B5BFCD] rounded-xl overflow-hidden bg-white">
                            <div className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#285497]">
                                (25) SUGGESTED SOLUTIONS
                            </div>
                            <div className="p-4">
                                <AutoResizeTextarea
                                    className="rounded-lg border border-[#B5BFCD] bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#0f53b7] font-normal"
                                    intMinRows={3}
                                    onChange={setStrSuggestedSolution}
                                    placeholder="State recommended solutions..."
                                    value={strSuggestedSolution}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#B5BFCD] rounded-xl p-6 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                            <div className="space-y-2 p-4 rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30">
                                <span className="text-slate-500 font-bold uppercase text-[11px] block">
                                    Prepared by (26):
                                </span>
                                <input
                                    className="h-8 w-full text-center font-semibold uppercase border border-[#B5BFCD] rounded-lg py-1 text-xs text-slate-900 bg-white focus:border-[#0f53b7] focus:outline-none"
                                    onChange={(objEvent) => setStrPreparedBy(objEvent.target.value)}
                                    value={strPreparedBy}
                                />
                                <p className="text-[11px] text-[#285497] font-bold mt-1">
                                    Project Leader, IA
                                </p>
                            </div>

                            <div className="space-y-2 p-4 rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30">
                                <span className="text-slate-500 font-bold uppercase text-[11px] block">
                                    Reviewed by (27):
                                </span>
                                <input
                                    className="h-8 w-full text-center font-semibold uppercase border border-[#B5BFCD] rounded-lg py-1 text-xs text-slate-900 bg-white focus:border-[#0f53b7] focus:outline-none"
                                    onChange={(objEvent) => setStrReviewedBy(objEvent.target.value)}
                                    value={strReviewedBy}
                                />
                                <p className="text-[11px] text-[#285497] font-bold mt-1">
                                    ARD or PSTD, DOST XI
                                </p>
                            </div>

                            <div className="space-y-2 p-4 rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30">
                                <span className="text-slate-500 font-bold uppercase text-[11px] block">
                                    Approved by (28):
                                </span>
                                <input
                                    className="h-8 w-full text-center font-semibold uppercase border border-[#B5BFCD] rounded-lg py-1 text-xs text-slate-900 bg-white focus:border-[#0f53b7] focus:outline-none"
                                    onChange={(objEvent) => setStrApprovedBy(objEvent.target.value)}
                                    value={strApprovedBy}
                                />
                                <p className="text-[11px] text-[#285497] font-bold mt-1">
                                    Regional Director, DOST XI
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#B5BFCD] pt-6 print:hidden">
                        <p className="text-xs font-semibold text-slate-500">
                            DOST-GIA Form 10 · Executive Summary of Technical Progress Report
                        </p>
                        <button
                            type="button"
                            onClick={_handleSave}
                            disabled={blnReadOnly || blnIsSaving || !onSave}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#B5BFCD] bg-white px-5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95"
                        >
                            <Save className="size-4 text-[#285497]" />
                            <span>{blnIsSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>
            </fieldset>
        </div>
    ); // end return
} /* end GiaMonitoringForm */

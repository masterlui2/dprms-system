/**
 * System: DPRMS
 * Purpose: Render proposal overview section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertCircle,
    BadgeCheck,
    Briefcase,
    Building2,
    Calendar,
    Clock,
    Download,
    FileText,
    HelpCircle,
    Layers,
    Mail,
    MapPin,
    Package,
    Phone,
    RefreshCw,
    ShieldCheck,
    Target,
    User,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import type { ProposalRecord } from '../../../data/admin';
import { getMockUser } from '../../../lib/mock_auth';
import { downloadBlob } from '../../../services/download_manager';
import
{
    fetchProposalOverview,
    type ProposalOverviewData,
} from '../../../services/proposal_overview_store';

interface ProposalOverviewSectionProps
{
    onReviewFiles?: () => void;
    objProposal: ProposalRecord;
}

/** Render proposal overview skeleton and its available actions. */
function ProposalOverviewSkeleton()
{
    return (
        <div
            aria-label="Loading proposal overview"
            className="animate-pulse space-y-3"
            role="status"
        >
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="h-4 w-56 rounded bg-slate-200" />
                <div className="h-8 w-40 rounded-lg bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_objUnused, intIndex) => (
                    <div
                        className="h-16 rounded-xl border border-slate-200 bg-white p-3"
                        key={intIndex}
                    >
                        <div className="h-3 w-20 rounded bg-slate-100" />
                        <div className="mt-2 h-4 w-28 rounded bg-slate-200" />
                    </div>
                ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_objUnused, intColumn) => (
                    <div
                        className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                        key={intColumn}
                    >
                        <div className="h-5 w-44 rounded bg-slate-200" />
                        {Array.from({ length: 6 }).map((_objUnusedValue, intRow) => (
                            <div className="space-y-2" key={intRow}>
                                <div className="h-3 w-28 rounded bg-slate-100" />
                                <div className="h-4 w-full rounded bg-slate-200" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <span className="sr-only">Loading proposal details from the server.</span>
        </div>
    ); // end return
} /* end ProposalOverviewSkeleton */

/** Render proposal overview section and its available actions. */
export function ProposalOverviewSection({ objProposal }: ProposalOverviewSectionProps)
{
    const [blnShowGuidelinesTooltip, setBlnShowGuidelinesTooltip] = useState(false);
    const [objOverview, setObjOverview] = useState<ProposalOverviewData | null>(null);
    const [blnIsLoading, setBlnIsLoading] = useState(true);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);
    const [intLoadAttempt, setIntLoadAttempt] = useState(0);

    const blnIsSetup = objProposal.program === 'SETUP';

    useEffect(
        () =>
        {
            let blnCancelled = false;
            setBlnIsLoading(true);
            setStrLoadError(null);
            setObjOverview(null);

            fetchProposalOverview(objProposal.id)
                .then((objData) =>
                {
                    if (!blnCancelled)
                    {
                        setObjOverview(objData);
                    }
                })
                .catch((errError) =>
                {
                    reportError(errError, 'Failed to load proposal overview:');
                    if (!blnCancelled)
                    {
                        const txtServerMessage = (
                            errError as { response?: { data?: { message?: string; }; }; }
                        ).response?.data?.message;
                        setStrLoadError(
                            txtServerMessage ||
                            'The proposal details could not be loaded from the server.',
                        );
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnIsLoading(false);
                    }
                });

            return () =>
            {
                blnCancelled = true;
            };
        } /* end ProposalOverviewSection */,
        [objProposal.id, intLoadAttempt],
    );

    if (blnIsLoading)
    {
        return <ProposalOverviewSkeleton />;
    }

    if (strLoadError || !objOverview)
    {
        return (
            <div
                className="grid min-h-[360px] place-items-center rounded-xl border border-rose-100 bg-white p-8 text-center shadow-2xs"
                role="alert"
            >
                <div className="max-w-md">
                    <span className="mx-auto grid size-11 place-items-center rounded-full bg-rose-50 text-rose-600">
                        <AlertCircle className="size-5" />
                    </span>
                    <h3 className="mt-3 text-sm font-black text-slate-900">
                        Unable to load proposal overview
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        {strLoadError || 'The server returned no proposal details.'}
                    </p>
                    <button
                        className="mx-auto mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                        onClick={() => setIntLoadAttempt((intAttempt) => intAttempt + 1)}
                        type="button"
                    >
                        <RefreshCw className="size-3.5" />
                        Try again
                    </button>
                </div>
            </div>
        ); // end return
    } /* end if */

    const objLoadedOverview = objOverview;
    const strEmptyValue = '—';
    const strProjectTitle = objOverview.projectTitle || strEmptyValue;
    const strGeneralObjective = objOverview.generalObjective || strEmptyValue;
    const strSpecificObjectives = objOverview.specificObjectives || strEmptyValue;
    const strProjectBackground = objOverview.projectBackground || strEmptyValue;
    const strNameOfFirm = objOverview.organizationName || strEmptyValue;
    const strFirmAddress = objOverview.address || strEmptyValue;
    const strContactPerson = objOverview.contactPerson || strEmptyValue;
    const strContactNo = objOverview.contactNumber || strEmptyValue;
    const strEmailAddress = objOverview.emailAddress || strEmptyValue;
    const strYearEstablished = blnIsSetup
        ? objOverview.yearEstablished || strEmptyValue
        : objOverview.siteOfImplementation || strEmptyValue;
    const strTypeOfOrganization = blnIsSetup
        ? objOverview.organizationType || strEmptyValue
        : objOverview.proponentCategory || strEmptyValue;
    const strBusinessSize = blnIsSetup
        ? objOverview.businessSize || strEmptyValue
        : objOverview.projectCategory || strEmptyValue;
    const strNumberOfEmployees = blnIsSetup
        ? objOverview.numberOfEmployees || strEmptyValue
        : objOverview.position || strEmptyValue;
    const strBusinessActivities = blnIsSetup
        ? objOverview.businessIndustry || strEmptyValue
        : objOverview.projectType || strEmptyValue;
    const strProductsServices = blnIsSetup
        ? objOverview.productsServices || strEmptyValue
        : objOverview.expectedOutputs || strEmptyValue;
    const strEnterpriseBackground = blnIsSetup
        ? objOverview.enterpriseBackground || strEmptyValue
        : objOverview.projectSummary || strEmptyValue;
    const strAssignedOfficer = objOverview.assignedOfficer || 'Not assigned';
    const strStatusLabel = objOverview.status
        .toLowerCase()
        .split('_')
        .map((strPart) => strPart.charAt(0).toUpperCase() + strPart.slice(1))
        .join(' ');
    const strSubmittedDate = new Date(objOverview.submittedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    /** Handle download proposal form. */
    async function _handleDownloadProposalForm()
    {
        const strHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DOST ${objLoadedOverview.program} Application Details - ${objLoadedOverview.referenceNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px solid #0f53b7; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 18px; color: #073b82; text-transform: uppercase; }
            .header h2 { margin: 4px 0 0; font-size: 14px; font-weight: normal; color: #64748b; }
            .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 8px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #073b82; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: 180px 1fr; row-gap: 8px; }
            .label { font-weight: 600; color: #64748b; font-size: 12px; }
            .value { font-weight: 500; color: #0f172a; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-top: 8px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>DEPARTMENT OF SCIENCE AND TECHNOLOGY · REGION XI</h2>
            <h1>${objLoadedOverview.program} Application Details</h1>
            <div class="badge">Reference ID: ${objLoadedOverview.referenceNo}</div>
          </div>

          <div class="section">
            <div class="section-title">1. Project Information</div>
            <div class="grid">
              <div class="label">Project Title:</div>
              <div class="value" style="font-weight: bold;">${strProjectTitle}</div>
            </div>
            <div class="box">
              <strong>General Objective:</strong><br />
              ${strGeneralObjective}
            </div>
            <div class="box" style="margin-top: 8px;">
              <strong>Specific Objectives:</strong><br />
              ${strSpecificObjectives}
            </div>
            <div class="box" style="margin-top: 8px;">
              <strong>Project Background:</strong><br />
              ${strProjectBackground}
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. ${blnIsSetup ? 'Company Profile' : 'Proponent Profile'}</div>
            <div class="grid">
              <div class="label">${blnIsSetup ? 'Name of Firm' : 'Organization'}:</div>
              <div class="value">${strNameOfFirm}</div>
              <div class="label">Address:</div>
              <div class="value">${strFirmAddress}</div>
              <div class="label">Contact Person:</div>
              <div class="value">${strContactPerson}</div>
              <div class="label">Contact No.:</div>
              <div class="value">${strContactNo}</div>
              <div class="label">E-mail Address:</div>
              <div class="value">${strEmailAddress}</div>
              <div class="label">${blnIsSetup ? 'Year Established' : 'Implementation Site'}:</div>
              <div class="value">${strYearEstablished}</div>
              <div class="label">${blnIsSetup ? 'Type of Organization' : 'Proponent Category'}:</div>
              <div class="value">${strTypeOfOrganization}</div>
              <div class="label">${blnIsSetup ? 'Business Size' : 'Project Category'}:</div>
              <div class="value">${strBusinessSize}</div>
              <div class="label">${blnIsSetup ? 'Number of Employees' : 'Leader Position'}:</div>
              <div class="value">${strNumberOfEmployees}</div>
              <div class="label">${blnIsSetup ? 'Business Activities' : 'Project Type'}:</div>
              <div class="value">${strBusinessActivities}</div>
              <div class="label">${blnIsSetup ? 'Products / Services' : 'Expected Outputs'}:</div>
              <div class="value">${strProductsServices}</div>
            </div>
            <div class="box" style="margin-top: 8px;">
              <strong>${blnIsSetup ? 'Brief Enterprise Background' : 'Project Summary'}:</strong><br />
              ${strEnterpriseBackground}
            </div>
          </div>

          <div class="section" style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center;">
            DOST Regional Proposal Application Data · Reference: ${objLoadedOverview.referenceNo} · Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </body>
      </html>
    `;

        const objCurrentUser = getMockUser();
        if (!objCurrentUser)
        {
            return;
        }
        try
        {
            await downloadBlob({
                blob: new Blob([strHtml], { type: 'text/html;charset=utf-8' }),
                fileName: `${objLoadedOverview.program}_${objLoadedOverview.referenceNo}_application_details.html`,
                program: objLoadedOverview.program,
                user: objCurrentUser,
            });
        } catch (errError)
        {
            reportError(errError, 'ProposalOverviewSection: handle download proposal form failed.');

            if (!(errError instanceof DOMException && errError.name === 'AbortError'))
            {
                reportError(errError, 'Failed to download application details:');
            }
        }
    } /* end _handleDownloadProposalForm */

    return (
        <div className="flex flex-col gap-2.5">
            {/* Slim Top Header Strip with Prominent Download Button & Assessment Criteria */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#073b82]">
                        Desk Validation & Application Review
                    </span>
                    {/* Criteria Tooltip Popover */}
                    <div className="relative">
                        <button
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#0f53b7] hover:bg-blue-100 transition cursor-pointer"
                            onClick={() => setBlnShowGuidelinesTooltip((blnValue) => !blnValue)}
                            onMouseEnter={() => setBlnShowGuidelinesTooltip(true)}
                            onMouseLeave={() => setBlnShowGuidelinesTooltip(false)}
                            title="View Assessment Guidelines"
                            type="button"
                        >
                            <HelpCircle className="size-3.5" />
                            <span>Criteria</span>
                        </button>

                        {blnShowGuidelinesTooltip && (
                            <div className="absolute left-0 top-full z-50 mt-1.5 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl transition animate-in fade-in zoom-in-95">
                                <p className="flex items-center gap-1.5 text-sm font-bold text-[#073b82] border-b border-slate-100 pb-2">
                                    <ShieldCheck className="size-4 text-[#0f53b7]" />
                                    DOST Desk Assessment Guidelines
                                </p>
                                <ul className="mt-2.5 space-y-2 text-xs sm:text-sm text-slate-600">
                                    <li className="flex items-start gap-1.5">
                                        <strong className="text-slate-900 shrink-0">
                                            1. Eligibility:
                                        </strong>
                                        <span>
                                            100% Filipino-owned MSME / cooperative in DOST priority
                                            sectors.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <strong className="text-slate-900 shrink-0">
                                            2. Compliance:
                                        </strong>
                                        <span>
                                            Mandatory attachments complete with at least 3
                                            comparative supplier bids.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <strong className="text-slate-900 shrink-0">
                                            3. Readiness:
                                        </strong>
                                        <span>
                                            Verified Technology Needs Assessment (TNA) and GAD
                                            scoring.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#0f53b7]">
                        Ref: {objOverview.referenceNo}
                    </span>
                </div>

                {/* Top Download Button */}
                <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-[#0f53b7] transition cursor-pointer"
                    onClick={() => void _handleDownloadProposalForm()}
                    title="Download / Print full Application Details for reference"
                    type="button"
                >
                    <Download className="size-3.5 text-[#0f53b7]" />
                    <span>Download Application Details</span>
                </button>
            </div>

            {/* Top Application Dimensions Strip */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
                    <span className="grid size-8.5 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
                        <Calendar className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Date Filed
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {strSubmittedDate}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
                    <span className="grid size-8.5 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                        <Layers className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {blnIsSetup ? 'Business Activities' : 'Project Type'}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {strBusinessActivities}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
                    <span className="grid size-8.5 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-700">
                        <Briefcase className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {blnIsSetup ? 'Business Size' : 'Project Category'}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {strBusinessSize}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
                    <span className="grid size-8.5 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <UserCheck className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Assigned Officer
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {strAssignedOfficer}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main 2-Column Application Structure (Clean, slightly enlarged text for optimal legibility) */}
            <div className="grid gap-3 lg:grid-cols-12">
                {/* Column 1: 1. Project Information (6 Cols) */}
                <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs lg:col-span-6">
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#073b82]">
                                <FileText className="size-4.5 text-[#0f53b7]" />
                                1. Project Information
                            </h4>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                Application Data
                            </span>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Project Title
                            </p>
                            <p className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                                {strProjectTitle}
                            </p>
                        </div>

                        {/* General Objective */}
                        <div className="rounded-lg bg-slate-50 p-2.5 sm:p-3 border border-slate-100">
                            <div className="flex items-center gap-1 text-xs font-bold text-[#073b82] uppercase tracking-wider mb-1">
                                <Target className="size-3.5 text-[#0f53b7] shrink-0" />
                                General Objective
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
                                {strGeneralObjective !== '—'
                                    ? strGeneralObjective
                                    : 'Not specified'}
                            </p>
                        </div>

                        {/* Specific Objectives */}
                        <div className="rounded-lg bg-slate-50 p-2.5 sm:p-3 border border-slate-100">
                            <p className="text-xs font-bold text-[#073b82] uppercase tracking-wider mb-1">
                                Specific Objectives
                            </p>
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium whitespace-pre-line">
                                {strSpecificObjectives !== '—'
                                    ? strSpecificObjectives
                                    : 'Not specified'}
                            </p>
                        </div>

                        {/* Project Background */}
                        <div className="rounded-lg bg-slate-50 p-2.5 sm:p-3 border border-slate-100">
                            <p className="text-xs font-bold text-[#073b82] uppercase tracking-wider mb-1">
                                Project Background
                            </p>
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
                                {strProjectBackground !== '—'
                                    ? strProjectBackground
                                    : 'Not specified'}
                            </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                            <p className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                                <Clock className="size-3.5 text-slate-400" />
                                Current Proposal Status
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
                                {strStatusLabel}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Column 2: 2. Proponent Profile (6 Cols) */}
                <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs lg:col-span-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#073b82]">
                                <Building2 className="size-4.5 text-[#0f53b7]" />
                                2. {blnIsSetup ? 'Company Profile' : 'Proponent Profile'}
                            </h4>
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#0f53b7]">
                                {strBusinessSize}
                            </span>
                        </div>

                        <dl className="mt-2 divide-y divide-slate-100 text-xs sm:text-sm">
                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Building2 className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Name of Firm' : 'Organization'}
                                </dt>
                                <dd className="font-bold text-slate-900 truncate">
                                    {strNameOfFirm}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <MapPin className="size-4 shrink-0 text-slate-400" />
                                    Address
                                </dt>
                                <dd className="font-medium text-slate-800 truncate">
                                    {strFirmAddress}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <User className="size-4 shrink-0 text-slate-400" />
                                    Contact Person
                                </dt>
                                <dd className="font-bold text-slate-900">{strContactPerson}</dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Phone className="size-4 shrink-0 text-slate-400" />
                                    Contact No.
                                </dt>
                                <dd className="font-medium text-slate-800">{strContactNo}</dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Mail className="size-4 shrink-0 text-slate-400" />
                                    E-mail Address
                                </dt>
                                <dd className="font-medium text-slate-800 truncate">
                                    {strEmailAddress}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Calendar className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Year Established' : 'Implementation Site'}
                                </dt>
                                <dd className="font-medium text-slate-800">{strYearEstablished}</dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <BadgeCheck className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Type of Organization' : 'Proponent Category'}
                                </dt>
                                <dd className="font-medium text-slate-800">
                                    {strTypeOfOrganization}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Briefcase className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Business Size' : 'Project Category'}
                                </dt>
                                <dd className="font-medium text-slate-800">{strBusinessSize}</dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Users className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Number of Employees' : 'Leader Position'}
                                </dt>
                                <dd className="font-medium text-slate-800">
                                    {strNumberOfEmployees}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Layers className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Business Activities' : 'Project Type'}
                                </dt>
                                <dd className="font-medium text-slate-800 truncate">
                                    {strBusinessActivities}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <Package className="size-4 shrink-0 text-slate-400" />
                                    {blnIsSetup ? 'Products / Services' : 'Expected Outputs'}
                                </dt>
                                <dd className="font-medium text-slate-800 truncate">
                                    {strProductsServices}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[145px_1fr] items-center py-1.5">
                                <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                                    <UserCheck className="size-4 shrink-0 text-slate-400" />
                                    Assigned Officer
                                </dt>
                                <dd className="font-semibold text-slate-800">
                                    {strAssignedOfficer}
                                </dd>
                            </div>
                        </dl>

                        {strEnterpriseBackground !== '—' && (
                            <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs sm:text-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">
                                    {blnIsSetup ? 'Enterprise Background' : 'Project Summary'}
                                </p>
                                <p className="text-slate-700 leading-snug mt-0.5 font-medium">
                                    {strEnterpriseBackground}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    ); // end return
} /* end ProposalOverviewSection */

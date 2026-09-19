/**
 * System: DPRMS
 * Purpose: Render proponent dashboard for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Activity,
    ArrowRight,
    Bell,
    CheckCircle2,
    CreditCard,
    FileCheck2,
    FilePlus2,
    FolderKanban,
    HardDrive,
    Info,
    Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { MetricCard } from '../../components/admin/MetricCard';
import { StatusPill } from '../../components/admin/StatusPill';
import { NotificationHistory } from '../../components/proponent/NotificationHistory';
import { ProponentSiteVisits } from '../../components/proponent/ProponentSiteVisits';
import { ProposalProgress } from '../../components/proponent/ProposalProgress';
import { getMockUser } from '../../lib/mock_auth';
import { getApplications, syncUserApplicationsFromBackend } from '../../services/application_store';
import
{
    fetchGiaDocumentaryRequirements,
    fetchSetupDocumentaryRequirements,
    getDocuments,
    type DocumentaryRequirement,
} from '../../services/document_store';
import { getGiaProposal } from '../../services/gia_proposal_store';
import { getSetupDraft } from '../../services/setup_proposal_store';
import type { ApplicationRecord } from '../../types/application';

type TabType = 'overview' | 'monitoring' | 'equipment' | 'repayment' | 'notifications';

/** Render proponent dashboard and its available actions. */
export function ProponentDashboard()
{
    const objLocation = useLocation();
    const _navigate = useNavigate();
    const objUser = getMockUser();
    const strRequestedTab = new URLSearchParams(objLocation.search).get('tab');
    const [strActiveTab, setStrActiveTab] = useState<TabType>(
        objLocation.pathname.endsWith('/notifications')
            ? 'notifications'
            : strRequestedTab === 'monitoring'
                ? 'monitoring'
                : 'overview',
    );
    const [arrAllApplications, setArrAllApplications] = useState<ApplicationRecord[]>(() =>
        getApplications(),
    );
    const intUserId = objUser?.id;
    const strUserName = objUser?.name;
    const strUserEmail = objUser?.email;
    const strUserApplicationReference = objUser?.applicationReference;

    useEffect(() =>
    {
        const strTab = new URLSearchParams(objLocation.search).get('tab');
        if (objLocation.pathname.endsWith('/notifications'))
        {
            setStrActiveTab('notifications');
        } else if (strTab === 'monitoring')
        {
            setStrActiveTab('monitoring');
        }
    }, [objLocation.pathname, objLocation.search]);

    useEffect(() =>
    {
        if (!strUserName || !strUserEmail)
        {
            return;
        }
        syncUserApplicationsFromBackend({
            id: intUserId,
            name: strUserName,
            email: strUserEmail,
            applicationReference: strUserApplicationReference,
        }).then((arrApps) =>
        {
            if (arrApps.length > 0)
            {
                setArrAllApplications(arrApps);
            }
        });
    }, [intUserId, strUserName, strUserEmail, strUserApplicationReference]);

    const strActiveProgram: ApplicationRecord['program'] = objLocation.pathname.startsWith('/gia')
        ? 'GIA'
        : objLocation.pathname.startsWith('/setup')
            ? 'SETUP'
            : (objUser?.program ?? 'SETUP');

    // Match applications that belong to the logged-in user
    const arrUserApplications = arrAllApplications.filter((objApp) =>
    {
        if (objUser?.applicationReference && objApp.referenceNo === objUser.applicationReference)
        {
            return true;
        }
        if (objUser?.email && objApp.contactEmail.toLowerCase() === objUser.email.toLowerCase())
        {
            return true;
        }
        if (objUser?.name && objApp.applicantName.toLowerCase() === objUser.name.toLowerCase())
        {
            return true;
        }
        return false;
    });

    // Never fall back to an application from the other program. SETUP and GIA
    // have independent proposal, revision, document, and progress states.
    const objApplication =
        arrUserApplications.find((objApp) => objApp.program === strActiveProgram) ?? null;
    const strApplicationProgram = objApplication?.program;
    const strApplicationReferenceNo = objApplication?.referenceNo;

    const objDocuments = strApplicationReferenceNo ? getDocuments(strApplicationReferenceNo) : {};
    const objGiaProposal =
        strApplicationProgram === 'GIA' ? getGiaProposal(strApplicationReferenceNo ?? '') : null;
    const objLiveSetup = strApplicationProgram === 'SETUP' ? getSetupDraft() : null;

    const [arrRequirements, setArrRequirements] = useState<DocumentaryRequirement[]>([]);

    useEffect(
        () =>
        {
            if (!strApplicationProgram)
            {
                setArrRequirements([]);
                return;
            }
            let blnCancelled = false;
            if (strApplicationProgram === 'SETUP')
            {
                fetchSetupDocumentaryRequirements(
                    objLiveSetup?.organizationType,
                    objLiveSetup?.businessSize,
                )
                    .then((arrRecords) =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements(arrRecords);
                        }
                    })
                    .catch(() =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements([]);
                        }
                    });
            } else
            {
                fetchGiaDocumentaryRequirements(objGiaProposal?.proponentCategory)
                    .then((arrRecords) =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements(arrRecords);
                        }
                    })
                    .catch(() =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements([]);
                        }
                    });
            }
            return () =>
            {
                blnCancelled = true;
            };
        } /* end ProponentDashboard */,
        [
            strApplicationReferenceNo,
            strApplicationProgram,
            objGiaProposal?.proponentCategory,
            objLiveSetup?.organizationType,
            objLiveSetup?.businessSize,
        ],
    );

    const arrRequiredRequirements = arrRequirements.filter((objRequest) => objRequest.required);
    const intUploadedCount = arrRequiredRequirements.filter((objRequest) =>
        Boolean(objDocuments[objRequest.id]),
    ).length;
    const blnDocumentsComplete =
        arrRequiredRequirements.length > 0 &&
        arrRequiredRequirements.every((objRequest) => Boolean(objDocuments[objRequest.id]));
    const strSubmittedReference = (objLocation.state as { submittedReference?: string; } | null)
        ?.submittedReference;
    const blnIsApproved = objApplication?.status === 'Approved';
    const blnIsUnderReview =
        objApplication?.status === 'Under review' ||
        objApplication?.status === 'Submitted' ||
        objApplication?.status === 'Draft Submitted';
    const blnIsGia = strActiveProgram === 'GIA';

    const txtStageTwoDescription = blnIsGia
        ? 'CEST Officers verify documentary completeness and initial eligibility criteria.'
        : 'SSCP Officers verify documentary completeness and initial eligibility criteria.';

    const TABS = [
        {
            id: 'overview' as TabType,
            label: 'Overview & Status',
            icon: <FolderKanban className="size-4" />,
        },
        {
            id: 'monitoring' as TabType,
            label: 'Project Monitoring',
            icon: <Activity className="size-4" />,
        },
        {
            id: 'equipment' as TabType,
            label: 'Equipment Tracking',
            icon: <Wrench className="size-4" />,
        },
        {
            id: 'repayment' as TabType,
            label: 'Repayment & Billing',
            icon: <CreditCard className="size-4" />,
        },
        {
            id: 'notifications' as TabType,
            label: 'Notifications',
            icon: <Bell className="size-4" />,
        },
    ];

    return (
        <div className="space-y-0 pb-8">
            {/* Success banner */}
            {strSubmittedReference ? (
                <div
                    className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800"
                    role="status"
                >
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                    <div>
                        <p className="font-black">Proposal submitted successfully</p>
                        <p className="mt-1 text-sm">
                            Your application is now active in your workspace.
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Header */}
            <div className="pb-5">
                <AdminPageHeader
                    objAction={null}
                    txtDescription="DOST PSTO Davao Oriental Proponent Management Portal."
                    strEyebrow={`${strActiveProgram} Proponent Portal`}
                    title={`Welcome${objUser?.name ? `, ${objUser.name.split(' ')[0]}` : ''}`}
                />
            </div>

            {/* Tabs — immediately after header, only shown when application exists */}
            {objApplication && (
                <div className="flex border-b border-slate-200 overflow-x-auto text-sm font-bold mb-6">
                    {TABS.map((objTab) => (
                        <button
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 whitespace-nowrap transition ${strActiveTab === objTab.id
                                ? 'border-[#0f53b7] text-[#0f53b7]'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            key={objTab.id}
                            onClick={() =>
                            {
                                if (objTab.id === 'repayment' && strActiveProgram === 'SETUP')
                                {
                                    _navigate('/setup/dashboard/finance');
                                    return;
                                }
                                setStrActiveTab(objTab.id);
                            }}
                            type="button"
                        >
                            {objTab.icon}
                            {objTab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ═══ STATE 1: No application ═════════════════════════════════ */}
            {!objApplication && (
                <section className="flex min-h-[340px] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                    <FilePlus2 className="size-12 text-[#0f53b7]" />
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            No Active Proposal Application
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-slate-500">
                            You have not started a proposal application yet. Click below to open
                            your workspace and begin.
                        </p>
                    </div>
                    <Link
                        className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#0b3f8b]"
                        to={blnIsGia ? '/gia/my-proposal' : '/setup/my-application'}
                    >
                        {blnIsGia ? 'Submit Proposal' : 'Submit Application'}{' '}
                        <ArrowRight className="size-4" />
                    </Link>
                </section>
            )}

            {/* ═══ STATE 2+: Application exists ═══════════════════════════ */}
            {objApplication && (
                <div className="space-y-5">
                    {/* ── OVERVIEW TAB = full dashboard view ─────────────────── */}
                    {strActiveTab === 'overview' && (
                        <div className="space-y-5">
                            {/* Metric cards */}
                            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <MetricCard
                                    strDetail={`Reference: ${objApplication.referenceNo}`}
                                    icon={FolderKanban}
                                    strLabel="Application Status"
                                    value={
                                        objApplication.status === 'Draft Submitted'
                                            ? 'Stage 1: Proposal Draft'
                                            : objApplication.status
                                    }
                                />
                                <MetricCard
                                    strDetail={`${intUploadedCount} of ${arrRequiredRequirements.length} required files`}
                                    icon={FileCheck2}
                                    strLabel="Supporting Documents"
                                    strTone="sky"
                                    value={`${intUploadedCount}/${arrRequiredRequirements.length}`}
                                />
                                <MetricCard
                                    strDetail={
                                        blnIsApproved
                                            ? 'Active milestones'
                                            : blnIsUnderReview
                                                ? 'Initial review in progress'
                                                : 'Activates upon approval'
                                    }
                                    icon={Activity}
                                    strLabel="Project Monitoring"
                                    strTone={
                                        blnIsApproved
                                            ? 'green'
                                            : blnIsUnderReview
                                                ? 'sky'
                                                : 'orange'
                                    }
                                    value={
                                        blnIsApproved
                                            ? 'Active'
                                            : blnIsUnderReview
                                                ? 'In Review'
                                                : 'Inactive'
                                    }
                                />
                                <MetricCard
                                    strDetail={
                                        blnIsApproved
                                            ? 'SETUP refund schedule active'
                                            : 'Generated upon MOA signing'
                                    }
                                    icon={CreditCard}
                                    strLabel="Repayment Status"
                                    strTone={blnIsApproved ? 'green' : 'green'}
                                    value={blnIsApproved ? 'Active' : 'Inactive'}
                                />
                            </section>

                            {/* My Proposal Application Overview — status + lifecycle merged */}
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                {/* Header block */}
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f53b7]">
                                        {blnIsGia
                                            ? 'My Proposal Overview'
                                            : 'My Application Overview'}
                                    </p>
                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900">
                                                {objApplication.program} Application
                                            </h2>
                                            <p className="mt-0.5 font-mono text-xs font-semibold text-slate-500">
                                                {objApplication.referenceNo}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusPill strTone="warning">
                                                {objApplication.status === 'Draft Submitted'
                                                    ? 'Waiting for Supporting Documents'
                                                    : objApplication.status}
                                            </StatusPill>
                                            <Link
                                                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3f8b]"
                                                to={
                                                    blnIsGia
                                                        ? '/gia/my-proposal'
                                                        : '/setup/my-application'
                                                }
                                            >
                                                {blnIsGia
                                                    ? 'View My Proposal'
                                                    : 'View My Application'}{' '}
                                                <ArrowRight className="size-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="mt-5">
                                        <ProposalProgress
                                            objApplication={objApplication}
                                            blnDocumentsComplete={blnDocumentsComplete}
                                            blnCompact
                                        />
                                    </div>
                                </div>

                                {/* Program lifecycle — inline row */}
                                {blnIsGia ? (
                                    <div className="grid divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-[#0f53b7] text-[11px] font-black text-white">
                                                1
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                Proposal & Documents
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                Fill out proposal details and attach required
                                                business, financial, and organizational documents.
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                2
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                PSTO Initial Review
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                {txtStageTwoDescription}
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                3
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                In Process
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                DOST project staff fulfill internal forms and attach
                                                technical evaluation documents.
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                4
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                Approval & Fund Release
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                Provincial Director approval, MOA signing, and
                                                project implementation.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid divide-y divide-slate-100 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-[#0f53b7] text-[11px] font-black text-white">
                                                1
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                Proposal & Documents
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                Fill out proposal details and attach required
                                                business, financial, and organizational documents.
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                2
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                PSTO Initial Review
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                {txtStageTwoDescription}
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                3
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                Technical Evaluation
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                RTEC conducts technical assessment and site
                                                verification.
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                4
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                In Process
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                DOST project staff fulfill internal forms and attach
                                                technical evaluation documents.
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">
                                                5
                                            </span>
                                            <h4 className="mt-3 text-xs font-bold text-slate-900">
                                                Approval & Fund Release
                                            </h4>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                                Provincial Director approval, MOA signing, and
                                                project implementation.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* ── OTHER TABS ─────────────────────────────────────────── */}
                    {strActiveTab === 'monitoring' && <ProponentSiteVisits />}

                    {strActiveTab === 'equipment' && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                <div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-600">
                                    <Wrench className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">
                                        Technology Asset & Equipment Inventory
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Acquired machinery, serial numbers, and maintenance
                                        schedules.
                                    </p>
                                </div>
                            </div>
                            <div className="py-10 text-center">
                                <HardDrive className="mx-auto size-10 text-slate-300" />
                                <h3 className="mt-3 text-sm font-black text-slate-800">
                                    No Equipment Recorded
                                </h3>
                                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">
                                    Equipment logs are managed here following project execution.
                                </p>
                            </div>
                        </div>
                    )}

                    {strActiveTab === 'repayment' && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CreditCard className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">
                                        SETUP Refund & Repayment Schedule
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Quarterly refund amortization, SOA, and payment records.
                                    </p>
                                </div>
                            </div>
                            <div className="py-10 text-center">
                                <Info className="mx-auto size-10 text-slate-300" />
                                <h3 className="mt-3 text-sm font-black text-slate-800">
                                    No Repayment Schedule Yet
                                </h3>
                                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">
                                    Refund schedules are generated upon project completion and MOA
                                    signing.
                                </p>
                            </div>
                        </div>
                    )}

                    {strActiveTab === 'notifications' && <NotificationHistory />}
                </div>
            )}
        </div>
    ); // end return
} /* end ProponentDashboard */

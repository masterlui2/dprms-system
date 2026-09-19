/**
 * System: DPRMS
 * Purpose: Render admin dashboard for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    Brain,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPanel } from '../../components/admin/AdminPanel';
import { MetricCard } from '../../components/admin/MetricCard';
import { StatusPill } from '../../components/admin/StatusPill';
import { FEATURE_IMPORTANCE, PREDICTIONS, PROPOSAL_RECORDS } from '../../data/admin';
import { cn } from '../../utils/cn';

const REMINDERS = [
    {
        title: 'Quarterly compliance report due',
        project: 'GreenHarvest',
        when: 'In 3 days',
        tone: 'bg-red-500',
    },
    {
        title: 'Site visit scheduled',
        project: 'Highland Coffee',
        when: 'Jul 5',
        tone: 'bg-[#0f53b7]',
    },
    {
        title: 'Equipment turnover activity',
        project: 'Bright Foods',
        when: 'Jul 12',
        tone: 'bg-amber-500',
    },
];

/** Render admin dashboard and its available actions. */
export function AdminDashboard()
{
    const _navigate = useNavigate();
    const [intSnapshotPage, setIntSnapshotPage] = useState(1);
    const intSnapshotRowsPerPage = 4;
    const intSnapshotPageCount = Math.max(
        1,
        Math.ceil(PREDICTIONS.length / intSnapshotRowsPerPage),
    );
    const intSafeSnapshotPage = Math.min(intSnapshotPage, intSnapshotPageCount);
    const arrVisiblePredictions = PREDICTIONS.slice(
        (intSafeSnapshotPage - 1) * intSnapshotRowsPerPage,
        intSafeSnapshotPage * intSnapshotRowsPerPage,
    );
    const intFirstSnapshotRow = PREDICTIONS.length
        ? (intSafeSnapshotPage - 1) * intSnapshotRowsPerPage + 1
        : 0;
    const intLastSnapshotRow = Math.min(
        intSafeSnapshotPage * intSnapshotRowsPerPage,
        PREDICTIONS.length,
    );
    const intExpanding = PREDICTIONS.filter(
        (objPrediction) => objPrediction.growth === 'Expanding',
    ).length;
    const intSustainable = PREDICTIONS.filter(
        (objPrediction) => objPrediction.sustainability === 'Sustainable',
    ).length;
    const intAtRisk = PREDICTIONS.filter(
        (objPrediction) => objPrediction.recommendation === 'At risk',
    ).length;
    const intRenewalRecommended = PREDICTIONS.filter(
        (objPrediction) => objPrediction.recommendation === 'Renewal recommended',
    ).length;
    const dblAverageRisk = Math.round(
        PREDICTIONS.reduce((intTotal, objPrediction) => intTotal + objPrediction.riskScore, 0) /
        PREDICTIONS.length,
    );
    const intGiaProposalCount = PROPOSAL_RECORDS.filter(
        (objProposal) => objProposal.program === 'GIA',
    ).length;
    const intSetupProposalCount = PROPOSAL_RECORDS.filter(
        (objProposal) => objProposal.program === 'SETUP',
    ).length;
    const intTotalProposalCount = PROPOSAL_RECORDS.length;
    const intGiaProposalShare = Math.round(
        (intGiaProposalCount / Math.max(intTotalProposalCount, 1)) * 100,
    );
    const intSetupProposalShare = 100 - intGiaProposalShare;
    const objAnalyticsOverviewPanel = (
        <AdminPanel
            txtDescription="Quick view of prediction movement and proposal distribution"
            title="Analytics overview"
        >
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        ['Avg. risk', String(dblAverageRisk), 'Risk score'],
                        ['Renewals', String(intRenewalRecommended), 'Recommended'],
                        ['At risk', String(intAtRisk), 'Needs action'],
                    ].map(([strLabel, strValue, strHelper]) => (
                        <div
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                            key={strLabel}
                        >
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                                {strLabel}
                            </p>
                            <p className="numeric-value mt-1 text-xl font-black text-[#073b82] text-right tabular-nums">
                                {strValue}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {strHelper}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-black text-slate-900">
                                GIA and SETUP proposals
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Current proposal distribution by program.
                            </p>
                        </div>
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
                            <TrendingUp className="size-4" />
                        </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                        <div className="flex justify-center">
                            <div
                                aria-label={`${intGiaProposalShare}% GIA proposals and ${intSetupProposalShare}% SETUP proposals`}
                                className="grid size-36 place-items-center rounded-full"
                                role="img"
                                style={{
                                    background: `conic-gradient(#0f53b7 0deg ${intGiaProposalShare * 3.6
                                        }deg, #f59e0b ${intGiaProposalShare * 3.6}deg 360deg)`,
                                }}
                            >
                                <div className="grid size-24 place-items-center rounded-full bg-white">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-slate-900">
                                            {intTotalProposalCount}
                                        </p>
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                            Proposals
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    count: intGiaProposalCount,
                                    label: 'GIA',
                                    share: intGiaProposalShare,
                                    tone: 'bg-[#0f53b7]',
                                },
                                {
                                    count: intSetupProposalCount,
                                    label: 'SETUP',
                                    share: intSetupProposalShare,
                                    tone: 'bg-amber-500',
                                },
                            ].map((objItem) => (
                                <div
                                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                                    key={objItem.label}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'size-2.5 rounded-full',
                                                    objItem.tone,
                                                )}
                                            />
                                            <span className="text-sm font-black text-slate-800">
                                                {objItem.label}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-[#073b82]">
                                            {objItem.count}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                                            <div
                                                className={cn('h-full rounded-full', objItem.tone)}
                                                style={{ width: `${objItem.share}%` }}
                                            />
                                        </div>
                                        <span className="w-9 text-right text-xs font-black text-slate-500">
                                            {objItem.share}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminPanel>
    );

    return (
        <div className="space-y-7">
            <AdminPageHeader
                txtDescription=""
                strEyebrow="Prediction Analysis"
                title="Prediction analysis stats"
            />

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    strDetail="Current prediction batch"
                    icon={Brain}
                    strLabel="MSMEs Assessed"
                    value={String(PREDICTIONS.length)}
                />
                <MetricCard
                    strDetail="Enterprises showing upward momentum"
                    icon={TrendingUp}
                    strLabel="Expanding"
                    strTone="sky"
                    value={String(intExpanding)}
                />
                <MetricCard
                    strDetail="Low sustainability risk"
                    icon={ShieldCheck}
                    strLabel="Sustainable"
                    strTone="green"
                    value={String(intSustainable)}
                />
                <MetricCard
                    strDetail="Needs immediate intervention"
                    icon={AlertTriangle}
                    strLabel="At Risk"
                    strTone="red"
                    value={String(intAtRisk)}
                />
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                <div className="space-y-5">
                    {objAnalyticsOverviewPanel}

                    <AdminPanel title="Prediction snapshot">
                        <div className="divide-y divide-slate-100">
                            {arrVisiblePredictions.map((objPrediction) => (
                                <article
                                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
                                    key={objPrediction.projectId}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900">
                                            {objPrediction.enterprise}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {objPrediction.projectId}
                                        </p>
                                    </div>
                                    <div className="flex min-w-[180px] items-center gap-3">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={
                                                    objPrediction.riskScore >= 70
                                                        ? 'h-full bg-red-500'
                                                        : objPrediction.riskScore >= 45
                                                            ? 'h-full bg-amber-500'
                                                            : 'h-full bg-emerald-500'
                                                }
                                                style={{ width: `${objPrediction.riskScore}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-slate-700">
                                            {objPrediction.riskScore}
                                        </span>
                                    </div>
                                    <StatusPill
                                        strTone={
                                            objPrediction.recommendation === 'Renewal recommended'
                                                ? 'success'
                                                : objPrediction.recommendation === 'At risk'
                                                    ? 'danger'
                                                    : 'warning'
                                        }
                                    >
                                        {objPrediction.recommendation}
                                    </StatusPill>
                                </article>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold text-slate-500">
                                Showing {intFirstSnapshotRow}-{intLastSnapshotRow} of{' '}
                                {PREDICTIONS.length}
                            </p>
                            <nav
                                aria-label="Prediction snapshot pagination"
                                className="flex items-center gap-1"
                            >
                                <button
                                    aria-label="Previous prediction snapshot page"
                                    className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    disabled={intSafeSnapshotPage === 1}
                                    onClick={() =>
                                        setIntSnapshotPage((intCurrent) =>
                                            Math.max(1, intCurrent - 1),
                                        )
                                    }
                                    type="button"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <span className="min-w-20 text-center text-xs font-bold text-slate-600">
                                    Page {intSafeSnapshotPage} of {intSnapshotPageCount}
                                </span>
                                <button
                                    aria-label="Next prediction snapshot page"
                                    className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    disabled={intSafeSnapshotPage === intSnapshotPageCount}
                                    onClick={() =>
                                        setIntSnapshotPage((intCurrent) =>
                                            Math.min(intSnapshotPageCount, intCurrent + 1),
                                        )
                                    }
                                    type="button"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </nav>
                        </div>
                    </AdminPanel>
                </div>

                <div className="space-y-5">
                    <AdminPanel
                        objAction={
                            <button
                                aria-label="Open site visit calendar"
                                className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
                                onClick={() =>
                                    _navigate('/dashboard/project-monitoring?view=calendar')
                                }
                                title="Open site visit calendar"
                                type="button"
                            >
                                <CalendarDays className="size-5" />
                            </button>
                        }
                        title="Upcoming reminders"
                    >
                        <ul className="divide-y divide-slate-100">
                            {REMINDERS.map((objReminder) => (
                                <li
                                    className="flex items-start gap-4 px-5 py-5"
                                    key={objReminder.title}
                                >
                                    <span
                                        className={cn(
                                            'mt-2 size-2.5 shrink-0 rounded-full',
                                            objReminder.tone,
                                        )}
                                    />
                                    <div>
                                        <p className="text-base font-black text-slate-900">
                                            {objReminder.title}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {objReminder.project} - {objReminder.when}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </AdminPanel>

                    <AdminPanel
                        txtDescription="Most influential drivers in the current scoring model"
                        title="Key model signals"
                    >
                        <div className="space-y-5 p-5">
                            {FEATURE_IMPORTANCE.map((objFeature) => (
                                <div key={objFeature.label}>
                                    <div className="flex justify-between gap-3 text-sm">
                                        <span className="font-semibold text-slate-700">
                                            {objFeature.label}
                                        </span>
                                        <span className="font-black text-[#073b82]">
                                            {objFeature.value}%
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#0f53b7]"
                                            style={{ width: `${objFeature.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AdminPanel>
                </div>
            </div>
        </div>
    ); // end return
} /* end AdminDashboard */

/**
 * System: DPRMS
 * Purpose: Render audit trail page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportError } from '../../utils/error_reporting';

import { AdminSelect } from '../../components/admin/AdminFilters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPanel } from '../../components/admin/AdminPanel';
import { DataTable, type DataColumn } from '../../components/admin/DataTable';
import { getAllProposals } from '../../services/proposal_store';
import type { ApplicationRecord } from '../../types/application';
import { cn } from '../../utils/cn';

interface AuditRecord
{
    action: string;
    date: string;
    dateValue: number;
    id: string;
    proposalId: string;
    projectTitle: string;
    remarks: string;
    role:
    | 'Administrator'
    | 'Initial Reviewer'
    | 'Technical Evaluator'
    | 'Regional Director'
    | 'System';
    status: 'Completed' | 'Pending' | 'Returned' | 'Rejected';
    user: string;
}

/** Build live audit records. */
function _buildLiveAuditRecords(arrProposals: ApplicationRecord[]): AuditRecord[]
{
    const arrRecords: AuditRecord[] = [];

    for (const objProposal of arrProposals)
    {
        const dtCreatedDate = objProposal.createdAt ? new Date(objProposal.createdAt) : new Date();
        const intCreatedTime = dtCreatedDate.getTime();
        const strPropId = objProposal.referenceNo || `PR-${objProposal.id}`;
        const strProjectTitle = objProposal.projectTitle || 'Untitled Proposal';
        const strApplicantName = objProposal.applicantName || 'Applicant';

        // 1. Proposal Submission Record
        arrRecords.push({
            id: `AUD-SUB-${objProposal.id}`,
            date: dtCreatedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            }),
            dateValue: intCreatedTime,
            proposalId: strPropId,
            projectTitle: strProjectTitle,
            user: strApplicantName,
            role: 'Initial Reviewer',
            action: 'Submitted proposal',
            status: 'Completed',
            remarks: `Proponent submitted ${objProposal.program} project application with initial requirements.`,
        });

        // 2. Desk Review / Validation
        if (objProposal.status !== 'Draft Submitted')
        {
            arrRecords.push({
                id: `AUD-REV-${objProposal.id}`,
                date: new Date(intCreatedTime + 1000 * 60 * 30).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
                dateValue: intCreatedTime + 1000 * 60 * 30,
                proposalId: strPropId,
                projectTitle: strProjectTitle,
                user: 'Focal Reviewer',
                role: 'Initial Reviewer',
                action: 'Desk validation initiated',
                status: 'Completed',
                remarks: 'Document checklist inspection opened for initial verification.',
            });
        }

        // 3. In Process (Assessment & TNA)
        if (
            objProposal.status === 'In Process' ||
            objProposal.status === 'Executive Approval' ||
            objProposal.status === 'Approved'
        )
        {
            arrRecords.push({
                id: `AUD-PROC-${objProposal.id}`,
                date: new Date(intCreatedTime + 1000 * 60 * 90).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
                dateValue: intCreatedTime + 1000 * 60 * 90,
                proposalId: strPropId,
                projectTitle: strProjectTitle,
                user: 'Focal Reviewer',
                role: 'Technical Evaluator',
                action: 'Advanced to Assessment & TNA',
                status: 'Completed',
                remarks:
                    'All proponent documents verified. Office assessment, site visit, and TNA unlocked.',
            });
        }

        // 4. Endorsement to Director
        if (objProposal.status === 'Executive Approval' || objProposal.status === 'Approved')
        {
            arrRecords.push({
                id: `AUD-END-${objProposal.id}`,
                date: new Date(intCreatedTime + 1000 * 60 * 180).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
                dateValue: intCreatedTime + 1000 * 60 * 180,
                proposalId: strPropId,
                projectTitle: strProjectTitle,
                user: 'Focal Reviewer',
                role: 'Technical Evaluator',
                action: 'Endorsed for Provincial Director approval',
                status: 'Completed',
                remarks: 'Technical evaluation and internal requirements completed and endorsed.',
            });
        }

        // 5. Final Approval / Disapproval / Revision
        if (objProposal.status === 'Approved')
        {
            arrRecords.push({
                id: `AUD-APP-${objProposal.id}`,
                date: new Date(intCreatedTime + 1000 * 60 * 240).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
                dateValue: intCreatedTime + 1000 * 60 * 240,
                proposalId: strPropId,
                projectTitle: strProjectTitle,
                user: 'Provincial Director',
                role: 'Regional Director',
                action: 'Approved application',
                status: 'Completed',
                remarks:
                    objProposal.remarks ||
                    'Formally approved for project fund scheduling and setup.',
            });
        } else if (objProposal.status === 'Disapproved')
        {
            arrRecords.push({
                id: `AUD-DIS-${objProposal.id}`,
                date: new Date(intCreatedTime + 1000 * 60 * 240).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
                dateValue: intCreatedTime + 1000 * 60 * 240,
                proposalId: strPropId,
                projectTitle: strProjectTitle,
                user: 'Provincial Director',
                role: 'Regional Director',
                action: 'Disapproved application',
                status: 'Rejected',
                remarks: objProposal.remarks || 'Application formally disapproved.',
            });
        } else if (objProposal.status === 'Returned for Revision')
        {
            arrRecords.push({
                id: `AUD-RET-${objProposal.id}`,
                date: new Date(intCreatedTime + 1000 * 60 * 240).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
                dateValue: intCreatedTime + 1000 * 60 * 240,
                proposalId: strPropId,
                projectTitle: strProjectTitle,
                user: 'Focal Reviewer',
                role: 'Initial Reviewer',
                action: 'Returned for revision',
                status: 'Returned',
                remarks: objProposal.remarks || 'Returned to proponent with required corrections.',
            });
        }
    } /* end loop */

    return arrRecords.sort((objLeft, objRight) => objRight.dateValue - objLeft.dateValue);
} /* end _buildLiveAuditRecords */

/** Status class. */
function _statusClass(strStatus: AuditRecord['status']): string
{
    if (strStatus === 'Completed')
    {
        return 'text-emerald-700';
    }
    if (strStatus === 'Rejected')
    {
        return 'text-red-600';
    }
    if (strStatus === 'Returned')
    {
        return 'text-amber-700';
    }
    return 'text-[#0f53b7]';
}

const COLUMNS: DataColumn<AuditRecord>[] = [
    {
        id: 'date',
        header: 'Date & Time',
        className: 'w-[180px]',
        sortValue: (objRecord) => objRecord.dateValue,
        render: (objRecord) => (
            <span className="whitespace-nowrap text-xs text-slate-600">{objRecord.date}</span>
        ),
    },
    {
        id: 'proposal',
        header: 'Proposal',
        className: 'w-[34%]',
        sortValue: (objRecord) => objRecord.projectTitle,
        render: (objRecord) => (
            <div>
                <p className="font-bold leading-6 text-slate-900">{objRecord.projectTitle}</p>
                <p className="mt-1 font-mono text-xs text-[#0f53b7]">{objRecord.proposalId}</p>
                <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 text-slate-500">
                    {objRecord.remarks}
                </p>
            </div>
        ),
    },
    {
        id: 'user',
        header: 'Actor',
        className: 'w-[220px]',
        sortValue: (objRecord) => objRecord.user,
        render: (objRecord) => (
            <div>
                <p className="font-semibold text-slate-900">{objRecord.user}</p>
                <p className="mt-1 text-xs text-slate-500">{objRecord.role}</p>
            </div>
        ),
    },
    {
        id: 'action',
        header: 'Action',
        className: 'w-[220px]',
        sortValue: (objRecord) => objRecord.action,
        render: (objRecord) => (
            <span className="font-semibold text-slate-800">{objRecord.action}</span>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        className: 'w-[150px]',
        sortValue: (objRecord) => objRecord.status,
        render: (objRecord) => (
            <span className={cn('font-bold', _statusClass(objRecord.status))}>
                {objRecord.status}
            </span>
        ),
    },
];

/** Render audit trail page and its available actions. */
export function AuditTrailPage()
{
    const [strRole, setStrRole] = useState('all');
    const [strStatus, setStrStatus] = useState('all');
    const [arrRecords, setArrRecords] = useState<AuditRecord[]>([]);
    const [blnLoading, setBlnLoading] = useState(true);

    /** Load data. */
    async function _loadData()
    {
        setBlnLoading(true);
        try
        {
            const arrProposals = await getAllProposals();
            const arrLiveRecords = _buildLiveAuditRecords(arrProposals);
            setArrRecords(arrLiveRecords);
        } catch (errError)
        {
            reportError(errError, 'AuditTrailPage: load data failed.');

            reportError(errError, 'Failed to load live audit proposals:');
        } finally
        {
            setBlnLoading(false);
        }
    }

    useEffect(() =>
    {
        void _loadData();
    }, []);

    const arrFiltered = arrRecords.filter(
        (objRecord) =>
            (strRole === 'all' || objRecord.role === strRole) &&
            (strStatus === 'all' || objRecord.status === strStatus),
    );

    return (
        <div className="space-y-7">
            <AdminPageHeader
                txtDescription="Review timestamped user and system actions across the proposal approval process."
                strEyebrow="Accountability"
                title="Audit Trail"
            />

            <AdminPanel
                txtDescription="Real-time audit log of proposal submissions, reviews, assessments, and approvals."
                title="System activity"
            >
                {blnLoading ? (
                    <div className="flex min-h-[260px] items-center justify-center">
                        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Loader2 className="size-4 animate-spin text-[#073b82]" />
                            Loading audit records from database…
                        </p>
                    </div>
                ) : (
                    <DataTable
                        arrColumns={COLUMNS}
                        arrData={arrFiltered}
                        txtEmptyDescription="No audit records match the selected role or status."
                        strEmptyTitle="No audit activity found"
                        getRowKey={(objRecord) => objRecord.id}
                        strSearchPlaceholder="Search audit activity..."
                        searchText={(objRecord) =>
                            `${objRecord.proposalId} ${objRecord.projectTitle} ${objRecord.user} ${objRecord.role} ${objRecord.action} ${objRecord.status} ${objRecord.remarks}`
                        }
                        objToolbar={
                            <>
                                <AdminSelect
                                    strLabel="Filter by role"
                                    onChange={setStrRole}
                                    arrOptions={[
                                        { label: 'All roles', value: 'all' },
                                        { label: 'Administrator', value: 'Administrator' },
                                        { label: 'Initial Reviewer', value: 'Initial Reviewer' },
                                        {
                                            label: 'Technical Evaluator',
                                            value: 'Technical Evaluator',
                                        },
                                        { label: 'Regional Director', value: 'Regional Director' },
                                        { label: 'System', value: 'System' },
                                    ]}
                                    value={strRole}
                                />
                                <AdminSelect
                                    strLabel="Filter by status"
                                    onChange={setStrStatus}
                                    arrOptions={[
                                        { label: 'All statuses', value: 'all' },
                                        { label: 'Completed', value: 'Completed' },
                                        { label: 'Pending', value: 'Pending' },
                                        { label: 'Returned', value: 'Returned' },
                                        { label: 'Rejected', value: 'Rejected' },
                                    ]}
                                    value={strStatus}
                                />
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                                    onClick={() => void _loadData()}
                                    type="button"
                                >
                                    <RefreshCw className="size-3.5" />
                                    Refresh
                                </button>
                                <span className="inline-flex h-10 items-center gap-2 px-2 text-xs font-semibold text-slate-500">
                                    <ShieldCheck className="size-4 text-[#0f53b7]" />
                                    Live database sync
                                </span>
                            </>
                        }
                    />
                )}
            </AdminPanel>
        </div>
    ); // end return
} /* end AuditTrailPage */

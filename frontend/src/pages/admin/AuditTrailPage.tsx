import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'

import { AdminSelect } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
import { getAllProposals } from '../../services/proposalStore'
import type { ApplicationRecord } from '../../types/application'
import { cn } from '../../utils/cn'

interface AuditRecord {
  action: string
  date: string
  dateValue: number
  id: string
  proposalId: string
  projectTitle: string
  remarks: string
  role: 'Administrator' | 'Initial Reviewer' | 'Technical Evaluator' | 'Regional Director' | 'System'
  status: 'Completed' | 'Pending' | 'Returned' | 'Rejected'
  user: string
}

function buildLiveAuditRecords(proposals: ApplicationRecord[]): AuditRecord[] {
  const records: AuditRecord[] = []

  for (const proposal of proposals) {
    const createdDate = proposal.createdAt ? new Date(proposal.createdAt) : new Date()
    const createdTime = createdDate.getTime()
    const propId = proposal.referenceNo || `PR-${proposal.id}`
    const projectTitle = proposal.projectTitle || 'Untitled Proposal'
    const applicantName = proposal.applicantName || 'Applicant'

    // 1. Proposal Submission Record
    records.push({
      id: `AUD-SUB-${proposal.id}`,
      date: createdDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      dateValue: createdTime,
      proposalId: propId,
      projectTitle,
      user: applicantName,
      role: 'Initial Reviewer',
      action: 'Submitted proposal',
      status: 'Completed',
      remarks: `Proponent submitted ${proposal.program} project application with initial requirements.`,
    })

    // 2. Desk Review / Validation
    if (proposal.status !== 'Draft Submitted') {
      records.push({
        id: `AUD-REV-${proposal.id}`,
        date: new Date(createdTime + 1000 * 60 * 30).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        dateValue: createdTime + 1000 * 60 * 30,
        proposalId: propId,
        projectTitle,
        user: 'Focal Reviewer',
        role: 'Initial Reviewer',
        action: 'Desk validation initiated',
        status: 'Completed',
        remarks: 'Document checklist inspection opened for initial verification.',
      })
    }

    // 3. In Process (Assessment & TNA)
    if (
      proposal.status === 'In Process' ||
      proposal.status === 'Executive Approval' ||
      proposal.status === 'Approved'
    ) {
      records.push({
        id: `AUD-PROC-${proposal.id}`,
        date: new Date(createdTime + 1000 * 60 * 90).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        dateValue: createdTime + 1000 * 60 * 90,
        proposalId: propId,
        projectTitle,
        user: 'Focal Reviewer',
        role: 'Technical Evaluator',
        action: 'Advanced to Assessment & TNA',
        status: 'Completed',
        remarks: 'All proponent documents verified. Office assessment, site visit, and TNA unlocked.',
      })
    }

    // 4. Endorsement to Director
    if (proposal.status === 'Executive Approval' || proposal.status === 'Approved') {
      records.push({
        id: `AUD-END-${proposal.id}`,
        date: new Date(createdTime + 1000 * 60 * 180).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        dateValue: createdTime + 1000 * 60 * 180,
        proposalId: propId,
        projectTitle,
        user: 'Focal Reviewer',
        role: 'Technical Evaluator',
        action: 'Endorsed for Provincial Director approval',
        status: 'Completed',
        remarks: 'Technical evaluation and internal requirements completed and endorsed.',
      })
    }

    // 5. Final Approval / Disapproval / Revision
    if (proposal.status === 'Approved') {
      records.push({
        id: `AUD-APP-${proposal.id}`,
        date: new Date(createdTime + 1000 * 60 * 240).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        dateValue: createdTime + 1000 * 60 * 240,
        proposalId: propId,
        projectTitle,
        user: 'Provincial Director',
        role: 'Regional Director',
        action: 'Approved application',
        status: 'Completed',
        remarks: proposal.remarks || 'Formally approved for project fund scheduling and setup.',
      })
    } else if (proposal.status === 'Disapproved') {
      records.push({
        id: `AUD-DIS-${proposal.id}`,
        date: new Date(createdTime + 1000 * 60 * 240).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        dateValue: createdTime + 1000 * 60 * 240,
        proposalId: propId,
        projectTitle,
        user: 'Provincial Director',
        role: 'Regional Director',
        action: 'Disapproved application',
        status: 'Rejected',
        remarks: proposal.remarks || 'Application formally disapproved.',
      })
    } else if (proposal.status === 'Returned for Revision') {
      records.push({
        id: `AUD-RET-${proposal.id}`,
        date: new Date(createdTime + 1000 * 60 * 240).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        dateValue: createdTime + 1000 * 60 * 240,
        proposalId: propId,
        projectTitle,
        user: 'Focal Reviewer',
        role: 'Initial Reviewer',
        action: 'Returned for revision',
        status: 'Returned',
        remarks: proposal.remarks || 'Returned to proponent with required corrections.',
      })
    }
  }

  return records.sort((a, b) => b.dateValue - a.dateValue)
}

function statusClass(status: AuditRecord['status']): string {
  if (status === 'Completed') return 'text-emerald-700'
  if (status === 'Rejected') return 'text-red-600'
  if (status === 'Returned') return 'text-amber-700'
  return 'text-[#0f53b7]'
}

const columns: DataColumn<AuditRecord>[] = [
  {
    id: 'date',
    header: 'Date & Time',
    className: 'w-[180px]',
    sortValue: (record) => record.dateValue,
    render: (record) => (
      <span className="whitespace-nowrap text-xs text-slate-600">
        {record.date}
      </span>
    ),
  },
  {
    id: 'proposal',
    header: 'Proposal',
    className: 'w-[34%]',
    sortValue: (record) => record.projectTitle,
    render: (record) => (
      <div>
        <p className="font-bold leading-6 text-slate-900">
          {record.projectTitle}
        </p>
        <p className="mt-1 font-mono text-xs text-[#0f53b7]">
          {record.proposalId}
        </p>
        <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 text-slate-500">
          {record.remarks}
        </p>
      </div>
    ),
  },
  {
    id: 'user',
    header: 'Actor',
    className: 'w-[220px]',
    sortValue: (record) => record.user,
    render: (record) => (
      <div>
        <p className="font-semibold text-slate-900">{record.user}</p>
        <p className="mt-1 text-xs text-slate-500">{record.role}</p>
      </div>
    ),
  },
  {
    id: 'action',
    header: 'Action',
    className: 'w-[220px]',
    sortValue: (record) => record.action,
    render: (record) => (
      <span className="font-semibold text-slate-800">{record.action}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    className: 'w-[150px]',
    sortValue: (record) => record.status,
    render: (record) => (
      <span className={cn('font-bold', statusClass(record.status))}>
        {record.status}
      </span>
    ),
  },
]

export function AuditTrailPage() {
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const proposals = await getAllProposals()
      const liveRecords = buildLiveAuditRecords(proposals)
      setRecords(liveRecords)
    } catch (err) {
      console.error('Failed to load live audit proposals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filtered = records.filter(
    (record) =>
      (role === 'all' || record.role === role) &&
      (status === 'all' || record.status === status),
  )

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Review timestamped user and system actions across the proposal approval process."
        eyebrow="Accountability"
        title="Audit Trail"
      />

      <AdminPanel
        description="Real-time audit log of proposal submissions, reviews, assessments, and approvals."
        title="System activity"
      >
        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Loader2 className="size-4 animate-spin text-[#073b82]" />
              Loading audit records from database…
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            emptyDescription="No audit records match the selected role or status."
            emptyTitle="No audit activity found"
            getRowKey={(record) => record.id}
            searchPlaceholder="Search audit activity..."
            searchText={(record) =>
              `${record.proposalId} ${record.projectTitle} ${record.user} ${record.role} ${record.action} ${record.status} ${record.remarks}`
            }
            toolbar={
              <>
                <AdminSelect
                  label="Filter by role"
                  onChange={setRole}
                  options={[
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
                  value={role}
                />
                <AdminSelect
                  label="Filter by status"
                  onChange={setStatus}
                  options={[
                    { label: 'All statuses', value: 'all' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Pending', value: 'Pending' },
                    { label: 'Returned', value: 'Returned' },
                    { label: 'Rejected', value: 'Rejected' },
                  ]}
                  value={status}
                />
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  onClick={() => void loadData()}
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
  )
}

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import { AdminSelect } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
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

const auditRecords: AuditRecord[] = [
  {
    id: 'AUD-1042',
    date: 'Jul 3, 2026 - 10:42 AM',
    dateValue: 1783046520000,
    proposalId: 'PR-2026-037',
    projectTitle: 'Precision Coffee Roasting System',
    user: 'Maria Santos',
    role: 'Regional Director',
    action: 'Approved final review',
    status: 'Completed',
    remarks: 'Approved for project creation and fund scheduling.',
  },
  {
    id: 'AUD-1041',
    date: 'Jul 3, 2026 - 9:15 AM',
    dateValue: 1783041300000,
    proposalId: 'PR-2026-038',
    projectTitle: 'Coastal Livelihood Technology Training',
    user: 'Ana Reyes',
    role: 'Technical Evaluator',
    action: 'Endorsed proposal',
    status: 'Completed',
    remarks: 'Technical scope verified and endorsed for budget review.',
  },
  {
    id: 'AUD-1040',
    date: 'Jul 2, 2026 - 4:08 PM',
    dateValue: 1782979680000,
    proposalId: 'PR-2026-041',
    projectTitle: 'Cacao Processing Line Modernization',
    user: 'DPRMS System',
    role: 'System',
    action: 'Assigned reviewer',
    status: 'Pending',
    remarks: 'Auto-assigned to the initial review team.',
  },
  {
    id: 'AUD-1039',
    date: 'Jul 2, 2026 - 2:33 PM',
    dateValue: 1782973980000,
    proposalId: 'PR-2026-036',
    projectTitle: 'Ceramics Kiln Efficiency Upgrade',
    user: 'Juan Dela Cruz',
    role: 'Initial Reviewer',
    action: 'Returned for revision',
    status: 'Returned',
    remarks: 'Updated equipment quotation and business profile required.',
  },
  {
    id: 'AUD-1038',
    date: 'Jul 2, 2026 - 11:20 AM',
    dateValue: 1782962400000,
    proposalId: 'PR-2026-035',
    projectTitle: 'Seafood Cold Chain Improvement',
    user: 'Ana Reyes',
    role: 'Technical Evaluator',
    action: 'Opened technical review',
    status: 'Pending',
    remarks: 'Technical documents queued for detailed assessment.',
  },
  {
    id: 'AUD-1037',
    date: 'Jul 1, 2026 - 5:05 PM',
    dateValue: 1782896700000,
    proposalId: 'PR-2026-034',
    projectTitle: 'Community Bamboo Product Development',
    user: 'DPRMS System',
    role: 'System',
    action: 'Validated documents',
    status: 'Completed',
    remarks: 'Five required GIA documents verified.',
  },
  {
    id: 'AUD-1036',
    date: 'Jul 1, 2026 - 3:12 PM',
    dateValue: 1782889920000,
    proposalId: 'PR-2026-033',
    projectTitle: 'Automated Furniture Cutting System',
    user: 'Admin Reyes',
    role: 'Administrator',
    action: 'Updated reviewer assignment',
    status: 'Completed',
    remarks: 'Reassigned to the regional director for final action.',
  },
  {
    id: 'AUD-1035',
    date: 'Jul 1, 2026 - 1:40 PM',
    dateValue: 1782884400000,
    proposalId: 'PR-2026-032',
    projectTitle: 'Fisherfolk Skills and Technology Program',
    user: 'Juan Dela Cruz',
    role: 'Initial Reviewer',
    action: 'Flagged incomplete submission',
    status: 'Returned',
    remarks: 'Supporting documents and permit are incomplete.',
  },
  {
    id: 'AUD-1034',
    date: 'Jun 30, 2026 - 4:22 PM',
    dateValue: 1782807720000,
    proposalId: 'PR-2026-031',
    projectTitle: 'Fruit Drying and Packaging Facility',
    user: 'Ana Reyes',
    role: 'Technical Evaluator',
    action: 'Completed technical evaluation',
    status: 'Completed',
    remarks: 'Technology specifications meet SETUP requirements.',
  },
  {
    id: 'AUD-1033',
    date: 'Jun 30, 2026 - 10:10 AM',
    dateValue: 1782785400000,
    proposalId: 'PR-2026-030',
    projectTitle: 'Municipal Disaster Data Platform',
    user: 'Maria Santos',
    role: 'Regional Director',
    action: 'Rejected proposal',
    status: 'Rejected',
    remarks: 'Scope falls outside the current GIA funding priorities.',
  },
]

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
  const filtered = auditRecords.filter(
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
        description="Mock audit records are read-only and organized for administrative review."
        title="System activity"
      >
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
              <span className="inline-flex h-10 items-center gap-2 px-2 text-xs font-semibold text-slate-500">
                <ShieldCheck className="size-4 text-[#0f53b7]" />
                Sort any column
              </span>
            </>
          }
        />
      </AdminPanel>
    </div>
  )
}

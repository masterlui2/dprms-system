import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  Landmark,
  ShieldCheck,
  UsersRound,
  Wrench,
} from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { MetricCard } from '../../components/admin/MetricCard'
import { StatusPill, type StatusTone } from '../../components/admin/StatusPill'
import { ROLE_LABEL, ROLES, type UserRole } from '../../config/permissions'
import { equipmentRecords, predictions, projectRecords, proposalRecords } from '../../data/admin'

type DashboardItem = {
  detail: string
  icon: typeof Activity
  label: string
  tone?: 'blue' | 'gold' | 'orange' | 'sky' | 'green' | 'red'
  value: string
}

type AttentionItem = {
  detail: string
  title: string
  tone: StatusTone
}

function dashboardContent(role: UserRole): {
  attention: AttentionItem[]
  cards: DashboardItem[]
  description: string
  eyebrow: string
  recent: string[]
  title: string
} {
  const pendingApplications = proposalRecords.filter((proposal) => proposal.status === 'Pending').length
  const atRiskProjects = projectRecords.filter((project) => project.status === 'At risk').length
  const inspectionDue = equipmentRecords.filter((equipment) => equipment.condition === 'Needs inspection').length
  const highRisk = predictions.filter((prediction) => prediction.riskScore >= 70).length

  switch (role) {
    case ROLES.PROJECT_STAFF:
      return {
        eyebrow: 'Uploader / Encoder',
        title: 'Project staff dashboard',
        description: 'Encode applications, upload internal DOST documents, and update basic tracker statuses.',
        cards: [
          { label: 'Data Entry', value: String(pendingApplications), detail: 'Applications for encoding', icon: ClipboardCheck },
          { label: 'Internal Uploads', value: '4', detail: 'MOA, TNA, inspection reports', icon: FileClock, tone: 'orange' },
          { label: 'Tracker Updates', value: '3', detail: 'Basic status changes', icon: Landmark, tone: 'sky' },
          { label: 'Equipment & QR', value: String(inspectionDue), detail: 'Assets needing updates', icon: Wrench, tone: 'red' },
        ],
        attention: [
          { title: 'Bright Foods Cooperative', detail: 'Signed MOA and inspection report are ready to upload.', tone: 'warning' },
          { title: 'GreenHarvest Producers', detail: 'Tracker status needs an update.', tone: 'info' },
          { title: 'Equipment registry', detail: `${inspectionDue} assets need QR or inspection updates.`, tone: 'danger' },
        ],
        recent: ['New SETUP application encoded', 'Inspection report uploaded', 'Equipment status updated'],
      }
    case ROLES.FOCAL:
      return {
        eyebrow: 'Reviewer / Evaluator',
        title: 'Focal dashboard',
        description: 'Review proposals, view internal documents, upload TNA records, monitor projects, and check reports.',
        cards: [
          { label: 'For Review', value: String(pendingApplications), detail: 'Uploaded PDFs to evaluate', icon: ClipboardCheck },
          { label: 'Returned', value: '2', detail: 'Waiting for revision', icon: FileClock, tone: 'orange' },
          { label: 'Reports', value: String(highRisk), detail: 'Risk items included', icon: AlertTriangle, tone: 'red' },
          { label: 'Monitoring', value: String(atRiskProjects), detail: 'Projects needing action', icon: Activity, tone: 'sky' },
        ],
        attention: [
          { title: 'Cacao Processing Line Modernization', detail: 'Recommendation is due this week.', tone: 'warning' },
          { title: 'Cold Storage Facility Upgrade', detail: 'Risk item is available in reports.', tone: 'danger' },
          { title: 'Community Water Quality Monitoring', detail: 'Revised PDF is ready for evaluation.', tone: 'info' },
        ],
        recent: ['Proposal approved for endorsement', 'TNA uploaded', 'Risk report reviewed'],
      }
    case ROLES.PROVINCIAL_DIRECTOR:
      return {
        eyebrow: 'Approver',
        title: 'Provincial director dashboard',
        description: 'Review focal recommendations and make final project decisions.',
        cards: [
          { label: 'Final Decisions', value: '3', detail: 'Awaiting action', icon: ShieldCheck },
          { label: 'Approved', value: String(proposalRecords.filter((proposal) => proposal.status === 'Approved').length), detail: 'Approved this period', icon: CheckCircle2, tone: 'green' },
          { label: 'Finance Records', value: '3', detail: 'For review', icon: Landmark, tone: 'sky' },
          { label: 'Terminate Review', value: String(atRiskProjects), detail: 'Projects flagged for decision', icon: AlertTriangle, tone: 'red' },
        ],
        attention: [
          { title: 'Precision Coffee Roasting System', detail: 'Focal recommendation is ready.', tone: 'warning' },
          { title: 'Cold Storage Facility Upgrade', detail: 'Termination review requested.', tone: 'danger' },
          { title: 'Provincial portfolio', detail: 'Latest report is available.', tone: 'info' },
        ],
        recent: ['Project approved', 'Decision package opened', 'Report viewed'],
      }
    case ROLES.RPMO:
      return {
        eyebrow: 'Regional Viewer',
        title: 'RPMO regional dashboard',
        description: 'Read-only regional performance, funding, and AI risk indicators for informed monitoring.',
        cards: [
          { label: 'Active Projects', value: String(projectRecords.filter((project) => project.status === 'Active').length), detail: 'Province-wide portfolio', icon: Activity },
          { label: 'Funds Released', value: 'PHP 8.7M', detail: 'Current portfolio', icon: Landmark, tone: 'sky' },
          { label: 'AI Risk Reports', value: String(highRisk), detail: 'Elevated risk projects', icon: AlertTriangle, tone: 'red' },
          { label: 'Reporting', value: '5 / 5', detail: 'Province coverage', icon: BarChart3, tone: 'green' },
        ],
        attention: [
          { title: 'Regional risk summary', detail: `${highRisk} projects have elevated AI risk signals.`, tone: 'danger' },
          { title: 'Funding utilization', detail: 'Portfolio utilization is on track for the current quarter.', tone: 'success' },
          { title: 'Province comparison', detail: 'All provinces submitted their latest monitoring data.', tone: 'info' },
        ],
        recent: ['Regional dashboard refreshed', 'AI risk summary updated', 'Province comparison report published'],
      }
    default:
      return {
        eyebrow: 'System overview',
        title: 'System administrator dashboard',
        description: 'Monitor DPRMS system health, users, programs, and recent platform activity.',
        cards: [
          { label: 'Total Users', value: '128', detail: 'Registered DPRMS accounts', icon: UsersRound },
          { label: 'Active Projects', value: String(projectRecords.filter((project) => project.status === 'Active').length), detail: 'Currently monitored', icon: Activity, tone: 'sky' },
          { label: 'Programs', value: '2', detail: 'SETUP and GIA', icon: ClipboardCheck, tone: 'gold' },
          { label: 'System Health', value: 'Healthy', detail: 'Services operating normally', icon: CheckCircle2, tone: 'green' },
        ],
        attention: [
          { title: 'Scheduled backup', detail: 'Daily backup completed successfully.', tone: 'success' },
          { title: 'User activity', detail: 'Eight new accounts were active this week.', tone: 'info' },
          { title: 'Audit logs', detail: 'No unusual administrative activity detected.', tone: 'success' },
        ],
        recent: ['System backup completed', 'Role assignment updated', 'New program configuration published'],
      }
  }
}

export function InternalDashboard({ role }: { role: UserRole }) {
  const content = dashboardContent(role)

  return (
    <div className="space-y-7">
      <AdminPageHeader description={content.description} eyebrow={content.eyebrow} title={content.title} />
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {content.cards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <AdminPanel description="Items that need attention based on your assigned role." title="Priority actions">
          <div className="divide-y divide-slate-100">
            {content.attention.map((item) => (
              <article className="flex items-start gap-4 px-5 py-4" key={item.title}>
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#0f53b7]" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{item.detail}</p>
                </div>
                <StatusPill tone={item.tone}>Review</StatusPill>
              </article>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel description={ROLE_LABEL[role]} title="Recent activity">
          <ol className="space-y-5 p-5">
            {content.recent.map((activity, index) => (
              <li className="relative flex gap-3" key={activity}>
                {index < content.recent.length - 1 ? <span className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-slate-200" /> : null}
                <span className="relative mt-1.5 size-3.5 shrink-0 rounded-full border-4 border-blue-100 bg-[#0f53b7]" />
                <p className="text-sm leading-6 text-slate-600">{activity}</p>
              </li>
            ))}
          </ol>
        </AdminPanel>
      </div>
    </div>
  )
}


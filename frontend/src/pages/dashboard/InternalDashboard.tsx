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
        eyebrow: 'Operations overview',
        title: 'Project staff dashboard',
        description: 'Work through pending applications, internal documents, payment verification, and equipment inspections.',
        cards: [
          { label: 'Pending Applications', value: String(pendingApplications), detail: 'Ready for staff processing', icon: ClipboardCheck },
          { label: 'Internal Documents', value: '4', detail: 'Awaiting validation', icon: FileClock, tone: 'orange' },
          { label: 'Payment Verification', value: '3', detail: 'Official receipts to review', icon: Landmark, tone: 'sky' },
          { label: 'Inspection Due', value: String(inspectionDue), detail: 'Equipment needs inspection', icon: Wrench, tone: 'red' },
        ],
        attention: [
          { title: 'Bright Foods Cooperative', detail: 'TNA and inspection report are still required.', tone: 'warning' },
          { title: 'GreenHarvest Producers', detail: 'Payment proof is awaiting verification.', tone: 'info' },
          { title: 'Equipment registry', detail: `${inspectionDue} assets need an updated inspection record.`, tone: 'danger' },
        ],
        recent: ['New SETUP application received', 'Inspection report uploaded for Cold Storage', 'Payment verification was assigned to you'],
      }
    case ROLES.FOCAL:
      return {
        eyebrow: 'Review queue',
        title: 'Focal reviewer dashboard',
        description: 'Prioritize technical reviews, returned applications, and projects needing intervention.',
        cards: [
          { label: 'Pending Reviews', value: String(pendingApplications), detail: 'Applications in your queue', icon: ClipboardCheck },
          { label: 'Returned Applications', value: '2', detail: 'Waiting for proponent updates', icon: FileClock, tone: 'orange' },
          { label: 'AI Risk Alerts', value: String(highRisk), detail: 'Projects with high-risk signals', icon: AlertTriangle, tone: 'red' },
          { label: 'Needs Intervention', value: String(atRiskProjects), detail: 'Active projects to monitor', icon: Activity, tone: 'sky' },
        ],
        attention: [
          { title: 'Cacao Processing Line Modernization', detail: 'Technical recommendation is due this week.', tone: 'warning' },
          { title: 'Cold Storage Facility Upgrade', detail: 'AI risk score requires a monitoring recommendation.', tone: 'danger' },
          { title: 'Community Water Quality Monitoring', detail: 'Proponent submitted revisions for review.', tone: 'info' },
        ],
        recent: ['Technical evaluation completed for PR-2026-040', 'Revision request sent to a SETUP proponent', 'New AI risk alert added to the review queue'],
      }
    case ROLES.PROVINCIAL_DIRECTOR:
      return {
        eyebrow: 'Executive overview',
        title: 'Provincial director dashboard',
        description: 'Review executive decisions, recently approved projects, and key provincial performance indicators.',
        cards: [
          { label: 'Executive Decisions', value: '3', detail: 'Awaiting final decision', icon: ShieldCheck },
          { label: 'Recently Approved', value: String(proposalRecords.filter((proposal) => proposal.status === 'Approved').length), detail: 'Projects approved this period', icon: CheckCircle2, tone: 'green' },
          { label: 'Active Projects', value: String(projectRecords.filter((project) => project.status === 'Active').length), detail: 'Under provincial monitoring', icon: Activity, tone: 'sky' },
          { label: 'Projects at Risk', value: String(atRiskProjects), detail: 'Require executive visibility', icon: AlertTriangle, tone: 'red' },
        ],
        attention: [
          { title: 'Precision Coffee Roasting System', detail: 'Executive approval package is ready for decision.', tone: 'warning' },
          { title: 'Cold Storage Facility Upgrade', detail: 'Risk status changed to at risk.', tone: 'danger' },
          { title: 'Provincial portfolio', detail: 'Monthly project performance report is available.', tone: 'info' },
        ],
        recent: ['One project was approved', 'Executive decision package added', 'Provincial monitoring report published'],
      }
    case ROLES.RPMO:
      return {
        eyebrow: 'Regional monitoring',
        title: 'RPMO regional dashboard',
        description: 'Read-only regional performance, funding, and AI risk indicators for informed monitoring.',
        cards: [
          { label: 'Active Projects', value: String(projectRecords.filter((project) => project.status === 'Active').length), detail: 'Across the regional portfolio', icon: Activity },
          { label: 'Total Funding', value: '₱8.7M', detail: 'Current monitored portfolio', icon: Landmark, tone: 'sky' },
          { label: 'AI Risk Summary', value: String(highRisk), detail: 'Projects with elevated risk', icon: AlertTriangle, tone: 'red' },
          { label: 'Provinces Reporting', value: '5 / 5', detail: 'Current reporting coverage', icon: BarChart3, tone: 'green' },
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

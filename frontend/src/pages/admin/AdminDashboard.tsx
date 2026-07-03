import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  ClipboardCheck,
  Clock3,
  QrCode,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { MetricCard } from '../../components/admin/MetricCard'
import { StatusPill } from '../../components/admin/StatusPill'
import {
  equipmentRecords,
  formatCurrency,
  projectRecords,
  proposalRecords,
} from '../../data/admin'

interface ModuleLink {
  description: string
  icon: LucideIcon
  title: string
  to: string
}

const modules: ModuleLink[] = [
  {
    title: 'Approval Workflow',
    description: 'Review proposals and approval history.',
    icon: ClipboardCheck,
    to: '/dashboard/approvals',
  },
  {
    title: 'Budget Tracking',
    description: 'Monitor releases and billing compliance.',
    icon: Wallet,
    to: '/dashboard/budget',
  },
  {
    title: 'Project Monitoring',
    description: 'Track milestones, reports, and site visits.',
    icon: Activity,
    to: '/dashboard/monitoring',
  },
  {
    title: 'QR Code Inventory',
    description: 'Manage equipment issuance and condition.',
    icon: QrCode,
    to: '/dashboard/inventory',
  },
  {
    title: 'Reports & Analytics',
    description: 'Prepare standardized management reports.',
    icon: BarChart3,
    to: '/dashboard/reports',
  },
  {
    title: 'Predictive Analytics',
    description: 'Review sustainability and renewal insights.',
    icon: Brain,
    to: '/dashboard/predictive',
  },
]

const recentActivity = [
  {
    title: 'Bright Foods submitted a SETUP proposal',
    detail: 'PR-2026-041 entered document screening.',
    time: '10 min ago',
    status: 'For screening',
  },
  {
    title: 'Cold Storage billing alert raised',
    detail: 'P-211 reached 99% budget utilization.',
    time: '32 min ago',
    status: 'Attention',
  },
  {
    title: 'Equipment condition updated',
    detail: 'EQ-0239 was returned and marked for repair.',
    time: '1 hr ago',
    status: 'Recorded',
  },
]

export function AdminDashboard() {
  const activeProjects = projectRecords.filter(
    (project) => project.status !== 'Completed',
  ).length
  const pendingProposals = proposalRecords.filter(
    (proposal) =>
      proposal.status === 'Pending' || proposal.status === 'Under review',
  ).length
  const allocated = projectRecords.reduce(
    (total, project) => total + project.budget,
    0,
  )
  const utilized = projectRecords.reduce(
    (total, project) => total + project.used,
    0,
  )
  const utilization = Math.round((utilized / allocated) * 100)
  const inventoryAlerts = equipmentRecords.filter(
    (equipment) => equipment.condition !== 'Good',
  ).length

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Monitor proposals, funded projects, resources, and compliance across GIA and SETUP."
        eyebrow="DOST Davao Oriental"
        title="Administration Overview"
      />

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          detail="+3 this quarter"
          icon={Activity}
          label="Active Projects"
          value={String(activeProjects)}
        />
        <MetricCard
          detail="2 require screening today"
          icon={ClipboardCheck}
          label="Pending Proposals"
          tone="orange"
          value={String(pendingProposals)}
        />
        <MetricCard
          detail={`${formatCurrency(utilized)} disbursed`}
          icon={Wallet}
          label="Budget Utilized"
          tone="gold"
          value={`${utilization}%`}
        />
        <MetricCard
          detail="Condition or inspection alerts"
          icon={TriangleAlert}
          label="Inventory Alerts"
          tone={inventoryAlerts ? 'red' : 'green'}
          value={String(inventoryAlerts)}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-black text-[#073b82]">Admin modules</h2>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              className="group flex items-center gap-4 rounded-2xl border border-[#d8e1ee] bg-white p-5 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:border-blue-300"
              key={module.to}
              to={module.to}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0f53b7]">
                <module.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-[#073b82]">
                  {module.title}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {module.description}
                </span>
              </span>
              <ArrowRight className="size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#0f53b7]" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <AdminPanel title="Recent activity">
          <div className="divide-y divide-slate-100">
            {recentActivity.map((item) => (
              <article
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                key={item.title}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Clock3 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill
                    tone={
                      item.status === 'Attention'
                        ? 'danger'
                        : item.status === 'For screening'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {item.status}
                  </StatusPill>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {item.time}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Needs attention">
          <div className="space-y-3 p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-bold text-red-800">1 overdue compliance report</p>
              <p className="mt-1 text-sm text-red-700">Cold Storage - P-211</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-amber-900">2 site visits this week</p>
              <p className="mt-1 text-sm text-amber-800">
                Bright Foods and Highland Coffee
              </p>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}

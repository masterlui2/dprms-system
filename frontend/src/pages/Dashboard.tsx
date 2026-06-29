import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  ClipboardCheck,
  FileUp,
  QrCode,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '../components/StatusBadge'
import { useApiConnection } from '../hooks/useApiConnection'
import { cn } from '../utils/cn'

type Metric = {
  accent: string
  detail: string
  icon: LucideIcon
  label: string
  value: string
}

type QuickAccessItem = {
  description: string
  icon: LucideIcon
  title: string
  to?: string
}

type ActivityItem = {
  lead: string
  status: string
  statusTone: string
  summary: string
  time: string
}

const metrics: Metric[] = [
  {
    label: 'Active Projects',
    value: '24',
    detail: '+3 this month',
    icon: Activity,
    accent: 'bg-[#0f53b7] text-white',
  },
  {
    label: 'Pending Approvals',
    value: '7',
    detail: '2 due this week',
    icon: ClipboardCheck,
    accent: 'bg-[#ff9a28] text-white',
  },
  {
    label: 'Budget Utilized',
    value: '68%',
    detail: '₱12.4M of ₱18.2M',
    icon: Wallet,
    accent: 'bg-[#ff7f1e] text-white',
  },
  {
    label: 'MSMEs Onboarded',
    value: '142',
    detail: '+12 this quarter',
    icon: TrendingUp,
    accent: 'bg-[#e4f1ff] text-[#0a3f8d]',
  },
]

const quickAccessItems: QuickAccessItem[] = [
  {
    title: 'Proposal Submission',
    description: 'Upload and track proposals.',
    icon: FileUp,
    to: '/proposal',
  },
  {
    title: 'Approval Workflow',
    description: 'Review pending applications.',
    icon: ClipboardCheck,
  },
  {
    title: 'Budget Tracking',
    description: 'Monitor allocations and disbursements.',
    icon: Wallet,
  },
  {
    title: 'Project Monitoring',
    description: 'Track milestones and compliance.',
    icon: Activity,
  },
  {
    title: 'QR Code Inventory',
    description: 'Scan and manage equipment.',
    icon: QrCode,
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate performance reports.',
    icon: BarChart3,
  },
  {
    title: 'Predictive Analytics',
    description: 'Random forest insights.',
    icon: Brain,
  },
]

const activityItems: ActivityItem[] = [
  {
    lead: 'Bright Foods Co.',
    summary: 'submitted a new proposal',
    status: 'Pending',
    statusTone: 'bg-[#e8f2ff] text-[#0a3f8d]',
    time: '10 min ago',
  },
  {
    lead: 'Ana Reyes (DOST)',
    summary: 'approved CarpenTech proposal',
    status: 'Approved',
    statusTone: 'bg-[#eaf8eb] text-[#18794e]',
    time: '32 min ago',
  },
  {
    lead: 'Regional budget utilization report',
    summary: 'was generated',
    status: 'Completed',
    statusTone: 'bg-[#eef2f7] text-slate-600',
    time: '1 hr ago',
  },
]

function QuickAccessCard({ item }: { item: QuickAccessItem }) {
  const cardClassName =
    'group flex items-center gap-4 rounded-[26px] border border-[#d8e1ee] bg-white px-6 py-5 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.65)] transition hover:border-[#c3d6ee] hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]'

  const content = (
    <>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e7f2ff] text-[#0a3f8d]">
        <item.icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-bold text-[#0a3f8d]">{item.title}</p>
        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-[#0a3f8d]" />
    </>
  )

  if (!item.to) {
    return (
      <button className={cn(cardClassName, 'cursor-default opacity-85')} disabled type="button">
        {content}
      </button>
    )
  }

  return (
    <Link className={cardClassName} to={item.to}>
      {content}
    </Link>
  )
}

export function Dashboard() {
  const { error, isLoading, message } = useApiConnection()

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#0a3f8d] sm:text-5xl">
              Welcome back, Admin
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-slate-600">
              Signed in as Administrator. Here&apos;s a quick overview of your portal activity.
            </p>
          </div>

          <div className="rounded-2xl border border-[#d8e1ee] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#edf5ff] text-[#0a3f8d]">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  API Status
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge tone={error ? 'warning' : 'success'}>
                    {isLoading ? 'Checking API' : error ? 'Offline' : 'Online'}
                  </StatusBadge>
                  <span className="text-sm text-slate-500">
                    {isLoading ? 'Loading...' : message ?? error}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            className="rounded-[28px] border border-[#d8e1ee] bg-white p-6 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.8)]"
            key={metric.label}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-5xl font-black tracking-tight text-[#0a3f8d]">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
              </div>

              <div className={cn('grid h-14 w-14 place-items-center rounded-3xl', metric.accent)}>
                <metric.icon className="h-6 w-6" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-black text-[#0a3f8d]">Quick access</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {quickAccessItems.map((item) => (
            <QuickAccessCard item={item} key={item.title} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-30px_rgba(15,23,42,0.8)]">
        <div className="border-b border-[#d8e1ee] px-6 py-5">
          <h2 className="text-2xl font-black text-[#0a3f8d]">Recent activity</h2>
        </div>

        <div className="divide-y divide-[#e5edf6]">
          {activityItems.map((item) => (
            <article
              className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between"
              key={`${item.lead}-${item.time}`}
            >
              <p className="text-[17px] text-slate-700">
                <span className="font-bold text-slate-950">{item.lead} </span>
                {item.summary}
              </p>

              <div className="flex items-center gap-4">
                <span className={cn('rounded-full px-3 py-1 text-sm font-bold', item.statusTone)}>
                  {item.status}
                </span>
                <span className="text-sm text-slate-500">{item.time}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

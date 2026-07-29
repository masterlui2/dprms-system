import { Building2, ClipboardList, Eye, Target, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ProposalRecord } from '../../../data/admin'
import { cn } from '../../../utils/cn'
import { getProponentDetails } from './proponentDetails'

interface ProposalOverviewSectionProps {
  onReviewFiles: () => void
  proposal: ProposalRecord
}

function OverviewSection({
  children,
  icon: Icon,
  tone,
  title,
}: {
  children: React.ReactNode
  icon: LucideIcon
  tone: 'blue' | 'amber'
  title: string
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span className={cn('grid size-9 place-items-center rounded-lg', tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-[#0f53b7]')}><Icon className="size-5" /></span>
        <h3 className="text-base font-black text-[#073b82] sm:text-lg">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function InformationRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <dt className="bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500 sm:border-r sm:border-slate-200">{label}</dt>
      <dd className="px-4 py-2.5 text-sm font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  )
}

export function ProposalOverviewSection({ onReviewFiles, proposal }: ProposalOverviewSectionProps) {
  const proponent = getProponentDetails(proposal)
  const isGia = proposal.program === 'GIA'
  const tone = isGia ? 'amber' : 'blue'
  const formSections: Array<{ icon: LucideIcon, rows: Array<[string, string]>, title: string }> = isGia
    ? [
      {
        title: '1. Proponent Information', icon: UserRound, rows: [
          ['Proponent category', proponent.organizationType],
          ['Organization name', proposal.organization],
          ['Office address', proponent.address],
          ['Project leader', proponent.contactPerson],
          ['Position', proponent.designation],
          ['Contact number', proponent.mobile],
          ['Email address', proponent.email],
        ],
      },
      {
        title: '2. Project Information', icon: Target, rows: [
          ['Project title', proposal.title],
          ['Project category', 'Science and technology intervention'],
          ['Project type', 'Community development project'],
          ['Project summary', 'Details are provided in the submitted GIA proposal document.'],
          ['Project rationale', 'Details are provided in the submitted GIA proposal document.'],
          ['General objective', 'Details are provided in the submitted GIA proposal document.'],
          ['Specific objectives', 'Details are provided in the submitted GIA proposal document.'],
        ],
      },
      {
        title: '3. Implementation and Results', icon: ClipboardList, rows: [
          ['Site of implementation', proponent.address],
          ['Target beneficiaries', 'See submitted project proposal.'],
          ['Implementation approach', 'See submitted project proposal.'],
          ['Expected outputs', 'See submitted project proposal.'],
          ['Sustainability plan', 'See submitted project proposal.'],
        ],
      },
    ]
    : [
      {
        title: '1. Project Information', icon: Target, rows: [
          ['Project title', proposal.title],
          ['General objective', 'Details are provided in the submitted SETUP proposal document.'],
          ['Specific objectives', 'Details are provided in the submitted SETUP proposal document.'],
          ['Project background', 'Details are provided in the submitted SETUP proposal document.'],
        ],
      },
      {
        title: '2. Company Profile', icon: Building2, rows: [
          ['Name of firm', proposal.organization],
          ['Address', proponent.address],
          ['Contact person', proponent.contactPerson],
          ['Contact no.', proponent.mobile],
          ['E-mail address', proponent.email],
          ['Year established', 'See submitted SETUP proposal document.'],
          ['Type of organization', proponent.organizationType],
          ['Business size', 'See submitted SETUP proposal document.'],
          ['Number of employees', 'See submitted SETUP proposal document.'],
          ['Business activities', 'See submitted SETUP proposal document.'],
          ['Products / services', 'See submitted SETUP proposal document.'],
          ['Brief enterprise background', 'See submitted SETUP proposal document.'],
        ],
      },
    ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Application overview</p>
          <h3 className="mt-1 text-xl font-black text-[#073b82]">{proposal.title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{proposal.completeness}% form completeness</p>
        </div>
        <button className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 text-sm font-bold text-[#073b82] transition hover:bg-blue-100" onClick={onReviewFiles} type="button"><Eye className="size-4" />Review submitted files</button>
      </div>

      <div className="grid gap-4">
        {formSections.map((section) => (
          <OverviewSection icon={section.icon} key={section.title} title={section.title} tone={tone}>
            <dl>{section.rows.map(([label, value]) => <InformationRow key={label} label={label} value={value} />)}</dl>
          </OverviewSection>
        ))}
      </div>
    </div>
  )
}

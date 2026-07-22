import {
  ArrowRight,
  Building2,
  FileText,
  GraduationCap,
  Landmark,
  PackageCheck,
  UsersRound,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProgramRegistrationUrl } from '../../lib/programAccess'

const programs: Array<{
  accent: string
  description: string
  detailsTo: string
  icon: LucideIcon
  items: Array<{ icon: LucideIcon; label: string }>
  label: string
  linkLabel: string
  title: string
}> = [
  {
    accent: 'bg-[#0f53b7]',
    description:
      'Choose this if you own or manage a business and need equipment, process improvement, packaging support, training, or technology assistance.',
    detailsTo: getProgramRegistrationUrl('SETUP'),
    icon: Wrench,
    items: [
      { icon: Building2, label: 'For MSMEs and enterprises' },
      { icon: PackageCheck, label: 'Equipment, packaging, or production support' },
      { icon: FileText, label: 'Business profile and quotations are usually needed' },
    ],
    label: 'SETUP',
    linkLabel: 'Register SETUP Proposal',
    title: 'Business technology assistance',
  },
  {
    accent: 'bg-[#f59e0b]',
    description:
      'Choose this if your school, organization, community group, or local office will submit a project for public benefit, research, training, or community development.',
    detailsTo: getProgramRegistrationUrl('GIA'),
    icon: GraduationCap,
    items: [
      { icon: UsersRound, label: 'For schools, LGUs, organizations, or groups' },
      { icon: Landmark, label: 'Research, training, or community projects' },
      { icon: FileText, label: 'Project proposal, budget, and endorsements are usually needed' },
    ],
    label: 'GIA',
    linkLabel: 'View GIA Details',
    title: 'Project proposal support',
  },
]

export function ProgramsSection() {
  return (
    <section
      className="scroll-mt-32 border-y border-[#d8e5f2] bg-[#eef5fb] px-4 py-16 sm:px-6 lg:px-8"
      id="programs"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
              Choose a program
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#073b82] sm:text-4xl">
              Which DOST support fits your request?
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
            Start with the track that matches your applicant type and project
            purpose. Each page explains who it is for, what to prepare, and how
            to continue with the form.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.label} program={program} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProgramCard({
  program,
}: {
  program: (typeof programs)[number]
}) {
  const Icon = program.icon

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[#d8e5f2] bg-white shadow-sm">
      <div className={`h-2 ${program.accent}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className={`grid size-12 place-items-center rounded-lg ${program.accent} text-white`}>
            <Icon className="size-5" />
          </div>
          <span className="rounded-md bg-[#eef5fb] px-2.5 py-1 text-xs font-black text-[#073b82]">
            {program.label}
          </span>
        </div>

        <h3 className="mt-5 text-2xl font-black leading-tight text-[#073b82]">
          {program.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {program.description}
        </p>

        <div className="mt-5 grid gap-2">
          {program.items.map(({ icon: ItemIcon, label }) => (
            <div
              className="flex min-h-16 items-start gap-3 rounded-md border border-slate-100 bg-[#f8fbff] px-3 py-3"
              key={label}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-[#073b82] ring-1 ring-slate-200">
                <ItemIcon className="size-4" />
              </span>
              <span className="text-sm font-semibold leading-6 text-slate-700">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <Link
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#d8e1ee] px-4 text-sm font-black text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50"
            to={program.detailsTo}
          >
            {program.linkLabel}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}

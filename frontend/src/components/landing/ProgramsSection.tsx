import {
  Building2,
  CheckCircle2,
  FileText,
  GitBranch,
  GraduationCap,
  Landmark,
  Microscope,
  PackageCheck,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { motion } from 'framer-motion'

const programPaths = [
  {
    accent: 'bg-[#0f53b7]',
    border: 'border-blue-200',
    description:
      'For enterprises that need technology upgrading, equipment, process improvement, packaging, or productivity support.',
    icon: Wrench,
    items: [
      { icon: Building2, label: 'Enterprise upgrading' },
      { icon: PackageCheck, label: 'Equipment or packaging support' },
      { icon: FileText, label: 'Business profile and quotations' },
    ],
    label: 'SETUP',
    title: 'Production and enterprise improvement',
  },
  {
    accent: 'bg-[#f59e0b]',
    border: 'border-amber-200',
    description:
      'For projects focused on research, community development, training, capability building, or public S&T interventions.',
    icon: Microscope,
    items: [
      { icon: UsersRound, label: 'Community or public benefit' },
      { icon: GraduationCap, label: 'Research, training, or capability building' },
      { icon: Landmark, label: 'Project proposal and endorsements' },
    ],
    label: 'GIA',
    title: 'Research and public-service projects',
  },
]

const checkpoints = [
  'Choose the program that matches the project purpose.',
  'Prepare the documents required by the selected track.',
  'Submit for validation, technical review, and monitoring.',
]

export function ProgramsSection() {
  return (
    <section id="programs" className="border-y border-[#d8e5f2] bg-[#f4f8fc] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dff1ff] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#073b82]">
            <span className="size-2 rounded-full bg-[#f4c542]" />
            Program Guide
          </div>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#073b82] md:text-5xl">
            Find the right DOST track at a glance
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            This visual guide helps proponents understand the difference between
            SETUP and GIA before they proceed to the proposal form.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 rounded-3xl border border-[#d8e5f2] bg-white p-5 shadow-[0_18px_45px_rgba(10,70,130,0.07)] sm:p-7"
          initial={{ opacity: 0, y: 26 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] lg:items-center">
            <ProgramPath path={programPaths[0]} />

            <div className="relative flex items-center justify-center py-2 lg:h-full">
              <div className="hidden absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-[#d8e5f2] lg:block" />
              <div className="hidden absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#d8e5f2] lg:block" />
              <div className="relative z-10 grid size-28 place-items-center rounded-full border border-[#d8e5f2] bg-[#073b82] text-white shadow-xl shadow-blue-950/20">
                <div className="text-center">
                  <GitBranch className="mx-auto size-7 text-[#f4c542]" />
                  <p className="mt-2 text-xs font-black uppercase tracking-wide">
                    DOST
                  </p>
                  <p className="text-xs font-bold text-blue-100">Program Fit</p>
                </div>
              </div>
            </div>

            <ProgramPath path={programPaths[1]} />
          </div>

          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">
            {checkpoints.map((checkpoint) => (
              <div
                className="flex gap-3 rounded-xl bg-[#f8fbff] px-4 py-4 text-sm leading-6 text-slate-600"
                key={checkpoint}
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{checkpoint}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ProgramPath({
  path,
}: {
  path: (typeof programPaths)[number]
}) {
  const Icon = path.icon

  return (
    <article className={`h-full rounded-2xl border ${path.border} bg-white p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`grid size-13 place-items-center rounded-2xl ${path.accent} text-white shadow-lg shadow-slate-900/10`}>
          <Icon className="size-6" />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
          {path.label}
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-black text-[#073b82]">{path.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{path.description}</p>

      <div className="mt-5 space-y-2">
        {path.items.map(({ icon: ItemIcon, label }) => (
          <div
            className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
            key={label}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#073b82] shadow-sm">
              <ItemIcon className="size-4" />
            </span>
            <span className="text-sm font-bold text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

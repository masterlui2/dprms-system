import { motion } from 'framer-motion'
import { ArrowRight, FlaskConical, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const proposalForms = [
  {
    title: 'SETUP Proposal Form',
    label: 'Enterprise upgrading',
    description:
      'Choose this if the proposal is for enterprise technology upgrading, equipment support, process improvement, or product quality improvement.',
    action: 'Start SETUP form',
    href: '/proposal?type=SETUP',
    icon: Wrench,
  },
  {
    title: 'GIA Proposal Form',
    label: 'Public benefit projects',
    description:
      'Choose this for research, community-based projects, capability building, training, or science and technology interventions.',
    action: 'Start GIA form',
    href: '/proposal?type=GIA',
    icon: FlaskConical,
  },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf6ff] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#073b82]">
            <span className="size-2 rounded-full bg-[#f4c542]" />
            Choose a Form
          </div>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#073b82] md:text-5xl">
            Select the proposal form that fits your project
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Pick one form below. SETUP is for enterprise technology upgrading,
            while GIA is for research, community, training, and science-based
            development projects.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {proposalForms.map((form, index) => {
            const Icon = form.icon

            return (
              <motion.article
                className="flex min-h-[300px] flex-col rounded-2xl border border-[#d8e5f2] bg-white p-7 shadow-[0_18px_45px_rgba(10,70,130,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(10,70,130,0.12)] sm:p-8"
                initial={{ opacity: 0, y: 26 }}
                key={form.title}
                transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#075cb8] text-white shadow-lg shadow-blue-900/15">
                    <Icon className="size-7" />
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#073b82]">
                    {form.label}
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-black tracking-tight text-[#073b82]">
                  {form.title}
                </h3>
                <p className="mt-4 flex-1 text-base leading-7 text-slate-600">
                  {form.description}
                </p>

                <Link
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-black text-white transition hover:bg-[#0b3f8b]"
                  to={form.href}
                >
                  {form.action}
                  <ArrowRight className="size-4" />
                </Link>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

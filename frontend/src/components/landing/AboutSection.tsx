import { Activity, ClipboardCheck, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

import { portalFeatures } from '../../data/landing'

const icons = [ClipboardCheck, Activity, MessageSquare]

export function AboutSection() {
  return (
    <section id="about" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf6ff] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#073b82]">
            <span className="size-2 rounded-full bg-[#f4c542]" />
            About the Portal
          </div>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#073b82] md:text-5xl">
            What is the DOST MSME Monitoring Portal?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
            A simple, secure digital portal that brings DOST and Filipino enterprises
            closer together — supporting MSMEs and DOST-assisted projects by making
            monitoring, requirements, and communication easier for everyone.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-7 lg:grid-cols-3">
          {portalFeatures.map((feature, index) => {
            const Icon = icons[index]

            return (
              <motion.article
                className="rounded-[22px] border border-[#d8e5f2] bg-white p-8 shadow-[0_18px_45px_rgba(10,70,130,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(10,70,130,0.12)] md:p-9"
                initial={{ opacity: 0, y: 26 }}
                key={feature.title}
                transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="grid size-16 place-items-center rounded-2xl bg-[#075cb8] text-white shadow-lg shadow-blue-900/15">
                  <Icon className="size-8" />
                </div>
                <h3 className="mt-8 text-2xl font-black tracking-tight text-[#073b82]">{feature.title}</h3>
                <p className="mt-4 text-lg leading-8 text-slate-600">{feature.description}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

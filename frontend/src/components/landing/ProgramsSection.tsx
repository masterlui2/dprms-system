import { ArrowRight, Cog, HandCoins, Store } from 'lucide-react'
import { motion } from 'framer-motion'

import { programCards } from '../../data/landing'

const icons = [Cog, HandCoins, Store]

const iconClasses = {
  blue: 'bg-[#075cb8] text-white',
  orange: 'bg-gradient-to-br from-[#f4aa32] to-[#ff7518] text-white',
} satisfies Record<string, string>

export function ProgramsSection() {
  return (
    <section id="programs" className="bg-[#eaf6ff] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dff1ff] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#073b82]">
            <span className="size-2 rounded-full bg-[#f4c542]" />
            DOST Programs Supported
          </div>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#073b82] md:text-5xl">
            Programs that Power Filipino Enterprises
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
            Discover the flagship DOST initiatives that this portal helps you access,
            manage, and monitor.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-7 lg:grid-cols-3">
          {programCards.map((program, index) => {
            const Icon = icons[index]
            const tone = program.tone === 'blue' ? 'blue' : 'orange'

            return (
              <motion.article
                className="relative overflow-hidden rounded-[22px] border border-[#d8e5f2] bg-white p-8 shadow-[0_18px_45px_rgba(10,70,130,0.07)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(10,70,130,0.14)] md:p-10"
                initial={{ opacity: 0, y: 26 }}
                key={program.title}
                transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="absolute -right-12 -top-12 size-36 rounded-full bg-slate-100" />
                <div className={`relative grid size-16 place-items-center rounded-2xl shadow-lg shadow-blue-900/10 ${iconClasses[tone]}`}>
                  <Icon className="size-8" />
                </div>
                <p className="relative mt-9 text-sm font-black uppercase tracking-[0.15em] text-slate-500">
                  {program.label}
                </p>
                <h3 className="relative mt-4 text-3xl font-black tracking-tight text-[#073b82]">{program.title}</h3>
                <p className="relative mt-5 text-lg leading-8 text-slate-600">{program.description}</p>
                <a
                  className="relative mt-8 inline-flex items-center gap-2 text-lg font-black text-[#006ee6] transition hover:gap-3 hover:text-[#073b82]"
                  href="#process"
                >
                  Learn more
                  <ArrowRight className="size-5" />
                </a>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { Clock3, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { motion } from 'framer-motion'

import { benefits } from '../../data/landing'
import { Card, CardContent } from '../ui/card'
import { AnimatedSection } from './AnimatedSection'
import { SectionHeader } from './SectionHeader'

const icons = [Users, ShieldCheck, Clock3, TrendingUp]

export function BenefitsSection() {
  return (
    <AnimatedSection id="benefits" className="relative overflow-hidden bg-[#07195f] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#0f53b7] via-[#11aee3] to-[#f4c542]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Benefits"
          theme="dark"
          title="Designed to feel useful before a user signs in"
          description="The public page gives MSME beneficiaries confidence that the system is organized, transparent, and connected to real technology upgrading outcomes."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {benefits.map((benefit, index) => {
            const Icon = icons[index]

            return (
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
                key={benefit.title}
                transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <Card className="h-full border-white/15 bg-white/10 text-white shadow-none backdrop-blur hover:bg-white/15">
                  <CardContent className="flex gap-5 p-6">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f4c542] text-[#07195f]">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{benefit.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-blue-100">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AnimatedSection>
  )
}

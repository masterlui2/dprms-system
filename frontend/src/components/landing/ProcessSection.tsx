import { BarChart3, ClipboardCheck, FileText, SearchCheck } from 'lucide-react'
import { motion } from 'framer-motion'

import { processSteps } from '../../data/landing'
import { Card, CardContent } from '../ui/card'
import { AnimatedSection } from './AnimatedSection'
import { SectionHeader } from './SectionHeader'

const stepIcons = [SearchCheck, FileText, ClipboardCheck, BarChart3]

export function ProcessSection() {
  return (
    <AnimatedSection id="process" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How it works"
          title="A clear government workflow from proposal to monitoring"
          description="The process follows the expected DOST service flow for GIA and SETUP proposals: selection, submission, validation, approval, and implementation monitoring."
        />

        <div className="relative mt-14">
          <div className="absolute left-8 top-10 hidden h-1 w-[calc(100%-4rem)] bg-gradient-to-r from-[#0f53b7] via-[#11aee3] to-[#f4c542] lg:block" />
          <div className="grid gap-6 lg:grid-cols-4">
            {processSteps.map((step, index) => {
              const Icon = stepIcons[index]

              return (
                <motion.div
                  initial={{ opacity: 0, y: 26 }}
                  key={step.title}
                  transition={{ delay: index * 0.09, duration: 0.5, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Card className="relative h-full bg-white hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="p-6">
                      <div className="relative z-10 grid size-16 place-items-center rounded-2xl bg-[#07195f] text-white shadow-lg shadow-blue-950/20">
                        <Icon className="size-8" />
                      </div>
                      <p className="mt-5 text-sm font-black text-[#0f53b7]">Step {index + 1}</p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">{step.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

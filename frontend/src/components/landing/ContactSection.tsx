import { Mail, MapPin, Phone, Send } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { AnimatedSection } from './AnimatedSection'

const contactItems = [
  { icon: Mail, label: 'Email', value: 'programs.support@dost.gov.ph' },
  { icon: Phone, label: 'Hotline', value: '(02) 8837 2071' },
  { icon: MapPin, label: 'Office', value: 'DOST Regional Office' },
]

export function ContactSection() {
  return (
    <AnimatedSection id="contact" className="bg-[#f3f8ff] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <div className="rounded-2xl bg-[#07195f] p-7 text-white shadow-2xl shadow-blue-950/20 sm:p-10">
          <p className="text-sm font-black uppercase text-blue-100">Official Assistance</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
            Ask about GIA or SETUP proposal requirements
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
            Use this section for general guidance on program fit, required
            documents, and the proper office for proposal assistance.
          </p>

          <div className="mt-10 space-y-4">
            {contactItems.map((item) => {
              const Icon = item.icon

              return (
                <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/10 p-4" key={item.label}>
                  <div className="grid size-11 place-items-center rounded-lg bg-white text-[#0f53b7]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-100">{item.label}</p>
                    <p className="text-sm font-bold">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="scroll-mt-32 shadow-xl shadow-blue-950/10" id="proposal">
          <CardContent className="p-6 sm:p-8">
            <p className="text-sm font-black uppercase text-[#0f53b7]">Program inquiry</p>
            <h3 className="mt-3 text-2xl font-black text-slate-950">Send an inquiry</h3>
            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Organization or enterprise name</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter organization, LGU, school, or enterprise name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Program interest</span>
                <select className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100">
                  <option>SETUP proposal</option>
                  <option>GIA proposal</option>
                  <option>Not sure yet</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Inquiry details</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                  placeholder="Briefly describe your project, program question, or document concern"
                />
              </label>
              <Button className="mt-2 w-full" type="button">
                <Send className="size-4" />
                Submit Inquiry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedSection>
  )
}

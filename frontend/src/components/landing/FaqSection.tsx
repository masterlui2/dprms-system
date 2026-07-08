import { HelpCircle } from 'lucide-react'

import { faqs } from '../../data/landing'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Card, CardContent } from '../ui/card'
import { AnimatedSection } from './AnimatedSection'
import { SectionHeader } from './SectionHeader'

export function FaqSection() {
  return (
    <AnimatedSection id="faq" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="FAQ"
            title="Questions proponents usually ask"
            description="Short guidance for choosing between GIA and SETUP and understanding the online proposal process."
          />
          <Card className="mt-8 hidden border-blue-100 bg-[#f7fbff] lg:block">
            <CardContent className="p-6">
              <HelpCircle className="size-10 text-[#0f53b7]" />
              <p className="mt-4 text-lg font-black text-[#07195f]">Need program details?</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This area can connect to official requirements, program
                guidelines, and regional DOST contact information.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-2 sm:p-4">
            <Accordion collapsible defaultValue="item-0" type="single">
              {faqs.map((faq, index) => (
                <AccordionItem className="px-4" key={faq.question} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AnimatedSection>
  )
}

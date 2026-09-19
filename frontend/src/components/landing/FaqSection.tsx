/**
 * System: DPRMS
 * Purpose: Render faq section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { HelpCircle } from 'lucide-react';

import { FAQS } from '../../data/landing';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { Card, CardContent } from '../ui/Card';
import { AnimatedSection } from './AnimatedSection';
import { SectionHeader } from './SectionHeader';

/** Render faq section and its available actions. */
export function FaqSection()
{
    return (
        <AnimatedSection id="faq" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <div>
                    <SectionHeader
                        strEyebrow="FAQ"
                        title="Questions proponents usually ask"
                        txtDescription="Short guidance for choosing between GIA and SETUP and understanding the online proposal process."
                    />
                    <Card className="mt-8 hidden border-blue-100 bg-[#f7fbff] lg:block">
                        <CardContent className="p-6">
                            <HelpCircle className="size-10 text-[#0f53b7]" />
                            <p className="mt-4 text-lg font-black text-[#07195f]">
                                Need program details?
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                This area can connect to official requirements, program guidelines,
                                and regional DOST contact information.q
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="overflow-hidden">
                    <CardContent className="p-2 sm:p-4">
                        <Accordion collapsible defaultValue="item-0" type="single">
                            {FAQS.map((objFaq, intIndex) => (
                                <AccordionItem
                                    className="px-4"
                                    key={objFaq.question}
                                    value={`item-${intIndex}`}
                                >
                                    <AccordionTrigger>{objFaq.question}</AccordionTrigger>
                                    <AccordionContent>{objFaq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </AnimatedSection>
    ); // end return
} /* end FaqSection */

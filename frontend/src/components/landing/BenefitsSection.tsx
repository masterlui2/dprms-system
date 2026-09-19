/**
 * System: DPRMS
 * Purpose: Render benefits section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { motion } from 'framer-motion';
import { Clock3, ShieldCheck, TrendingUp, Users } from 'lucide-react';

import { BENEFITS } from '../../data/landing';
import { Card, CardContent } from '../ui/Card';
import { AnimatedSection } from './AnimatedSection';
import { SectionHeader } from './SectionHeader';

const ICONS = [Users, ShieldCheck, Clock3, TrendingUp];

/** Render benefits section and its available actions. */
export function BenefitsSection()
{
    return (
        <AnimatedSection
            id="benefits"
            className="relative overflow-hidden bg-[#07195f] px-4 py-24 text-white sm:px-6 lg:px-8"
        >
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#0f53b7] via-[#11aee3] to-[#f4c542]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />

            <div className="relative mx-auto max-w-7xl">
                <SectionHeader
                    strEyebrow="Portal Services"
                    strTheme="dark"
                    title="Built for official GIA and SETUP transactions"
                    txtDescription="The homepage presents the portal as a structured public service for proposal submission, review tracking, document handling, and project monitoring."
                />

                <div className="mt-14 grid gap-5 md:grid-cols-2">
                    {BENEFITS.map((objBenefit, intIndex) =>
                    {
                        const Icon = ICONS[intIndex];

                        return (
                            <motion.div
                                initial={{ opacity: 0, x: intIndex % 2 === 0 ? -24 : 24 }}
                                key={objBenefit.title}
                                transition={{
                                    delay: intIndex * 0.08,
                                    duration: 0.5,
                                    ease: 'easeOut',
                                }}
                                viewport={{ once: true }}
                                whileInView={{ opacity: 1, x: 0 }}
                            >
                                <Card className="h-full border-white/15 bg-white/10 text-white shadow-none backdrop-blur hover:bg-white/15">
                                    <CardContent className="flex gap-5 p-6">
                                        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f4c542] text-[#07195f]">
                                            <Icon className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black">
                                                {objBenefit.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-7 text-blue-100">
                                                {objBenefit.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </AnimatedSection>
    ); // end return
} /* end BenefitsSection */

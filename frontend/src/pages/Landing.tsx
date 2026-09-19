/**
 * System: DPRMS
 * Purpose: Render landing for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { AboutSection } from '../components/landing/AboutSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { ContactSection } from '../components/landing/ContactSection';
import { FaqSection } from '../components/landing/FaqSection';
import { HeroSection } from '../components/landing/HeroSection';
import { ProcessSection } from '../components/landing/ProcessSection';
import { ProgramsSection } from '../components/landing/ProgramsSection';
import { ScrollToTopButton } from '../components/landing/ScrollToTopButton';
import { SiteFooter } from '../components/landing/SiteFooter';
import { SiteHeader } from '../components/landing/SiteHeader';

/** Render landing and its available actions. */
export function Landing()
{
    const objLocation = useLocation();

    useEffect(() =>
    {
        document.documentElement.classList.add('landing-page-active');
        return () =>
        {
            document.documentElement.classList.remove('landing-page-active');
        };
    }, []);

    useEffect(() =>
    {
        if (!objLocation.hash)
        {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        window.requestAnimationFrame(() =>
        {
            document.querySelector(objLocation.hash)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }, [objLocation.hash, objLocation.pathname]);

    return (
        <div className="landing-page min-h-screen bg-white text-slate-950">
            <SiteHeader />
            <main>
                <HeroSection />
                <AboutSection />
                <ProgramsSection />
                <ProcessSection />
                <BenefitsSection />
                <FaqSection />
                <ContactSection />
            </main>
            <SiteFooter />
            <ScrollToTopButton />
        </div>
    );
} /* end Landing */

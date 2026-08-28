import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { AboutSection } from '../components/landing/AboutSection'
import { BenefitsSection } from '../components/landing/BenefitsSection'
import { ContactSection } from '../components/landing/ContactSection'
import { FaqSection } from '../components/landing/FaqSection'
import { HeroSection } from '../components/landing/HeroSection'
import { ProcessSection } from '../components/landing/ProcessSection'
import { ProgramsSection } from '../components/landing/ProgramsSection'
import { SiteFooter } from '../components/landing/SiteFooter'
import { SiteHeader } from '../components/landing/SiteHeader'
import { ScrollToTopButton } from '../components/landing/ScrollToTopButton'

export function Landing() {
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.add('landing-page-active')
    return () => {
      document.documentElement.classList.remove('landing-page-active')
    }
  }, [])

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.requestAnimationFrame(() => {
      document.querySelector(location.hash)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [location.hash, location.pathname])

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
  )
}

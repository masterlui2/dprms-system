import { AboutSection } from '../components/landing/AboutSection'
import { BenefitsSection } from '../components/landing/BenefitsSection'
import { ContactSection } from '../components/landing/ContactSection'
import { FaqSection } from '../components/landing/FaqSection'
import { HeroSection } from '../components/landing/HeroSection'
import { ProcessSection } from '../components/landing/ProcessSection'
import { ProgramsSection } from '../components/landing/ProgramsSection'
import { SiteFooter } from '../components/landing/SiteFooter'
import { SiteHeader } from '../components/landing/SiteHeader'

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
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
    </div>
  )
}

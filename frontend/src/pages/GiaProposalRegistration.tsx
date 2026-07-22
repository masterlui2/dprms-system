import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { SiteFooter } from '../components/landing/SiteFooter'
import { SiteHeader } from '../components/landing/SiteHeader'
import { GiaProposalForm } from '../components/proposal/GiaProposalForm'
import { getMockUser } from '../lib/mockAuth'
import { getProgramRegistrationUrl, hasProgramAccess } from '../lib/programAccess'

export function GiaProposalRegistration() {
  const location = useLocation()
  const user = getMockUser()

  if (!user && !hasProgramAccess('GIA')) {
    return <Navigate replace state={{ from: location.pathname }} to={getProgramRegistrationUrl('GIA')} />
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-slate-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-lg px-1 text-sm font-bold text-[#073b82] transition hover:text-[#0f53b7]" to="/programs/gia">
          <ArrowLeft className="size-4" />
          Back to GIA overview
        </Link>
        <GiaProposalForm />
      </main>
      <SiteFooter />
    </div>
  )
}

import { Bell, CheckCircle2, FileCheck2, FilePlus2, FolderKanban } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { MetricCard } from '../../components/admin/MetricCard'
import { ProposalProgress } from '../../components/proponent/ProposalProgress'
import { StatusPill } from '../../components/admin/StatusPill'
import { isSampleSetupApplication } from '../../data/sampleSetupProposal'
import { getMockUser } from '../../lib/mockAuth'
import { getDocumentaryRequirements, getDocuments } from '../../services/documentStore'
import { getApplications } from '../../services/applicationStore'
import { getGiaProposal } from '../../services/giaProposalStore'
import { getSetupProposal } from '../../services/setupProposalStore'

export function ProponentDashboard() {
  const location = useLocation()
  const user = getMockUser()
  const allApplications = getApplications()
  const accountApplications = allApplications.filter((application) =>
    user?.applicationReference
      ? application.referenceNo === user.applicationReference
      : !user?.email || application.contactEmail.toLowerCase() === user.email.toLowerCase(),
  )
  const applications = accountApplications.length || user?.program !== 'SETUP'
    ? accountApplications
    : allApplications.filter((application) => isSampleSetupApplication(application.referenceNo))
  const latest = applications[0]
  const latestDocuments = latest ? getDocuments(latest.referenceNo) : {}
  const latestProposal = latest?.program === 'SETUP' ? getSetupProposal(latest.referenceNo) : null
  const latestGiaProposal = latest?.program === 'GIA' ? getGiaProposal(latest.referenceNo) : null
  const requirements = latest ? getDocumentaryRequirements(latest.program, latestProposal?.organizationType, latestGiaProposal?.proponentCategory) : []
  const requiredRequirements = requirements.filter((requirement) => requirement.required)
  const uploadedCount = requirements.filter((requirement) => latestDocuments[requirement.id]).length
  const documentsComplete = requiredRequirements.length > 0
    && requiredRequirements.every((requirement) => latestDocuments[requirement.id])
  const registrationPath = user?.program === 'GIA' ? '/programs/gia/register' : '/programs/setup/register'
  const submittedReference = (location.state as { submittedReference?: string } | null)?.submittedReference

  return (
    <div className="space-y-7">
      {submittedReference ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-black">Proposal submitted successfully</p><p className="mt-1 text-sm">Reference {submittedReference} is now waiting for supporting documents.</p></div>
        </div>
      ) : null}

      <AdminPageHeader
        action={<Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b]" to={registrationPath}><FilePlus2 className="size-4" />Register Proposal</Link>}
        description="Track your proposals, upload supporting documents, and follow DOST review progress."
        eyebrow={`${user?.program ?? 'DOST'} Proponent`}
        title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Proposals in your account" icon={FolderKanban} label="My Proposals" value={String(applications.length)} />
        <MetricCard detail="For your latest proposal" icon={FileCheck2} label="Documents Uploaded" tone="sky" value={String(uploadedCount)} />
        <MetricCard detail="Required files still needed" icon={Bell} label="Action Items" tone="orange" value={latest ? String(requiredRequirements.filter((item) => !latestDocuments[item.id]).length) : '0'} />
        <MetricCard detail="Completed DOST decisions" icon={CheckCircle2} label="Approved" tone="green" value={String(applications.filter((item) => item.status === 'Approved').length)} />
      </section>

      {latest ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f53b7]">Current proposal</p>{isSampleSetupApplication(latest.referenceNo) ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">Sample data</span> : null}</div><h2 className="mt-2 text-xl font-black text-slate-900">{latest.projectTitle}</h2><p className="mt-1 font-mono text-xs font-semibold text-slate-500">{latest.referenceNo}</p></div>
            <StatusPill tone="warning">{latest.status === 'Draft Submitted' ? 'Waiting for Supporting Documents' : latest.status}</StatusPill>
          </div>
          <ProposalProgress application={latest} documentsComplete={documentsComplete} compact />
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <AdminPanel title="My Proposals">
          {applications.length ? <div className="divide-y divide-slate-100">{applications.slice(0, 4).map((proposal) => (
            <article className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center" key={proposal.id}>
              <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{proposal.projectTitle}</p><p className="mt-1 text-xs text-slate-500">{proposal.referenceNo} - {new Date(proposal.createdAt).toLocaleDateString()}</p></div>
              <StatusPill tone="warning">{proposal.status === 'Draft Submitted' ? 'Waiting for Supporting Documents' : proposal.status}</StatusPill>
            </article>
          ))}</div> : <div className="p-6 text-center text-sm text-slate-500">No proposals yet. Start with the simplified SETUP form.</div>}
        </AdminPanel>

        <AdminPanel title="Next step">
          <div className="space-y-3 p-5">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-[#073b82]">
              <p className="font-black">{latest ? 'Complete supporting documents' : 'Start your proposal'}</p>
              <p className="mt-1 text-xs">{latest ? 'Upload supporting files separately. Your business profile will not be requested again.' : 'Complete one clean online form. Your draft saves automatically.'}</p>
            </div>
            <Link className="flex h-12 items-center justify-center rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white" to={latest ? `/dashboard/documents?proposal=${latest.referenceNo}` : registrationPath}>{latest ? 'Open Supporting Documents' : 'Register Proposal'}</Link>
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}

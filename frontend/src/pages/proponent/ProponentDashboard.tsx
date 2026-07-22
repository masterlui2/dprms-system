import { Bell, CheckCircle2, FileCheck2, FilePlus2, FolderKanban } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { MetricCard } from '../../components/admin/MetricCard'
import { ProposalProgress } from '../../components/proponent/ProposalProgress'
import { StatusPill } from '../../components/admin/StatusPill'
import { getMockUser } from '../../lib/mockAuth'
import { documentaryRequirements, getDocuments } from '../../services/documentStore'
import { getSetupApplications } from '../../services/setupProposalStore'

export function ProponentDashboard() {
  const location = useLocation()
  const user = getMockUser()
  const applications = getSetupApplications().filter((application) =>
    user?.applicationReference
      ? application.referenceNo === user.applicationReference
      : !user?.email || application.contactEmail.toLowerCase() === user.email.toLowerCase(),
  )
  const latest = applications[0]
  const latestDocuments = latest ? getDocuments(latest.referenceNo) : {}
  const uploadedCount = Object.keys(latestDocuments).length
  const documentsComplete = Boolean(latest) && documentaryRequirements
    .filter((requirement) => requirement.required)
    .every((requirement) => latestDocuments[requirement.id])
  const submittedReference = (location.state as { submittedReference?: string } | null)?.submittedReference

  return (
    <div className="space-y-7">
      {submittedReference ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-black">Proposal submitted successfully</p><p className="mt-1 text-sm">Reference {submittedReference} is now waiting for documentary requirements.</p></div>
        </div>
      ) : null}

      <AdminPageHeader
        action={<Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b]" to="/programs/setup/register"><FilePlus2 className="size-4" />Register Proposal</Link>}
        description="Track your SETUP proposal, upload supporting requirements, and follow DOST review progress."
        eyebrow="SETUP Proponent"
        title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="SETUP proposals in your account" icon={FolderKanban} label="My Proposals" value={String(applications.length)} />
        <MetricCard detail="For your latest proposal" icon={FileCheck2} label="Documents Uploaded" tone="sky" value={String(uploadedCount)} />
        <MetricCard detail="Required files still needed" icon={Bell} label="Action Items" tone="orange" value={latest ? String(documentaryRequirements.filter((item) => item.required && !latestDocuments[item.id]).length) : '0'} />
        <MetricCard detail="Completed DOST decisions" icon={CheckCircle2} label="Approved" tone="green" value={String(applications.filter((item) => item.status === 'Approved').length)} />
      </section>

      {latest ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f53b7]">Current proposal</p><h2 className="mt-2 text-xl font-black text-slate-900">{latest.projectTitle}</h2><p className="mt-1 font-mono text-xs font-semibold text-slate-500">{latest.referenceNo}</p></div>
            <StatusPill tone="warning">{latest.status === 'Draft Submitted' ? 'Waiting for Documentary Requirements' : latest.status}</StatusPill>
          </div>
          <ProposalProgress application={latest} documentsComplete={documentsComplete} compact />
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <AdminPanel title="My Proposals">
          {applications.length ? <div className="divide-y divide-slate-100">{applications.slice(0, 4).map((proposal) => (
            <article className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center" key={proposal.id}>
              <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{proposal.projectTitle}</p><p className="mt-1 text-xs text-slate-500">{proposal.referenceNo} - {new Date(proposal.createdAt).toLocaleDateString()}</p></div>
              <StatusPill tone="warning">{proposal.status === 'Draft Submitted' ? 'Waiting for Documentary Requirements' : proposal.status}</StatusPill>
            </article>
          ))}</div> : <div className="p-6 text-center text-sm text-slate-500">No proposals yet. Start with the simplified SETUP form.</div>}
        </AdminPanel>

        <AdminPanel title="Next step">
          <div className="space-y-3 p-5">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-[#073b82]">
              <p className="font-black">{latest ? 'Complete documentary requirements' : 'Start your proposal'}</p>
              <p className="mt-1 text-xs">{latest ? 'Upload supporting files separately. Your business profile will not be requested again.' : 'Complete one clean online form. Your draft saves automatically.'}</p>
            </div>
            <Link className="flex h-12 items-center justify-center rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white" to={latest ? `/dashboard/documents?proposal=${latest.referenceNo}` : '/programs/setup/register'}>{latest ? 'Open Documentary Requirements' : 'Register Proposal'}</Link>
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}

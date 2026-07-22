import { ClipboardCheck } from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ProposalProgress } from '../../components/proponent/ProposalProgress'
import { isSampleSetupApplication } from '../../data/sampleSetupProposal'
import { getMockUser } from '../../lib/mockAuth'
import { getDocumentaryRequirements, getDocuments } from '../../services/documentStore'
import { getApplications } from '../../services/applicationStore'
import { getGiaProposal } from '../../services/giaProposalStore'
import { getSetupProposal } from '../../services/setupProposalStore'

export function ApplicationStatusPage() {
  const user = getMockUser()
  const applications = getApplications()
  const application = applications.find((item) =>
    user?.applicationReference ? item.referenceNo === user.applicationReference : item.contactEmail.toLowerCase() === user?.email.toLowerCase(),
  ) ?? (user?.program === 'SETUP'
    ? applications.find((item) => isSampleSetupApplication(item.referenceNo))
    : undefined)
  const documents = application ? getDocuments(application.referenceNo) : {}
  const setupProposal = application?.program === 'SETUP' ? getSetupProposal(application.referenceNo) : null
  const giaProposal = application?.program === 'GIA' ? getGiaProposal(application.referenceNo) : null
  const requirements = application ? getDocumentaryRequirements(application.program, setupProposal?.organizationType, giaProposal?.proponentCategory) : []
  const requiredRequirements = requirements.filter((item) => item.required)
  const complete = requiredRequirements.length > 0 && requiredRequirements.every((item) => documents[item.id])

  return (
    <div className="space-y-7">
      <AdminPageHeader description="Follow your proposal from submission through DOST evaluation." eyebrow="Application Workflow" title="Application Status" />
      {application ? <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-start gap-4 border-b border-slate-100 pb-6"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><ClipboardCheck className="size-5" /></span><div><p className="font-mono text-xs font-bold text-[#0f53b7]">{application.referenceNo}</p><h2 className="mt-1 text-xl font-black text-slate-900">{application.projectTitle}</h2><p className="mt-1 text-sm text-slate-500">{application.organizationName}</p></div></div>
        <ProposalProgress application={application} documentsComplete={complete} />
        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-[#073b82]">{complete ? 'Your required files are complete. The proposal is ready for DOST initial review.' : 'Your proposal was submitted. Complete the final document upload to proceed to initial review.'}</div>
      </section> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><p className="font-bold text-slate-700">No submitted proposal is available yet.</p></div>}
    </div>
  )
}

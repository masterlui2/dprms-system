import { ArrowRight, FilePlus2, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatusPill } from '../../components/admin/StatusPill'
import { getMockUser } from '../../lib/mockAuth'
import { getSetupApplications } from '../../services/setupProposalStore'

function displayStatus(status: string) {
  return status === 'Draft Submitted' ? 'Waiting for Documentary Requirements' : status
}

function statusTone(status: string): 'success' | 'warning' | 'info' | 'danger' {
  if (status === 'Approved') return 'success'
  if (status === 'Returned for Revision') return 'danger'
  if (status === 'Under review') return 'info'
  return 'warning'
}

export function MyProposalsPage() {
  const user = getMockUser()
  const applications = getSetupApplications().filter((application) =>
    user?.applicationReference
      ? application.referenceNo === user.applicationReference
      : !user?.email || application.contactEmail.toLowerCase() === user.email.toLowerCase(),
  )

  return (
    <div className="space-y-7">
      <AdminPageHeader
        action={<Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b]" to="/programs/setup/register"><FilePlus2 className="size-4" />Register Proposal</Link>}
        description="View submitted SETUP proposals and continue outstanding requirements."
        eyebrow="SETUP Proponent"
        title="My Proposals"
      />

      {applications.length ? (
        <div className="grid gap-4">
          {applications.map((application) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" key={application.id}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><FolderOpen className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-bold text-slate-500">{application.referenceNo}</p>
                    <StatusPill tone={statusTone(application.status)}>{displayStatus(application.status)}</StatusPill>
                  </div>
                  <h2 className="mt-2 text-lg font-black text-slate-900">{application.projectTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">{application.organizationName} - Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>
                <Link className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-[#073b82] transition hover:bg-blue-100" to={`/dashboard/documents?proposal=${encodeURIComponent(application.referenceNo)}`}>Upload requirements<ArrowRight className="size-4" /></Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FolderOpen className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-800">No SETUP proposals yet</h2>
          <p className="mt-2 text-sm text-slate-500">Start a simplified online proposal when your enterprise is ready.</p>
          <Link className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white" to="/programs/setup/register">Register Proposal</Link>
        </div>
      )}
    </div>
  )
}

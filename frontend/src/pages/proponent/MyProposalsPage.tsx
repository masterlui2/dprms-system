import { useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, FilePlus2, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatusPill } from '../../components/admin/StatusPill'
import { isSampleSetupApplication } from '../../data/sampleSetupProposal'
import { getMockUser } from '../../lib/mockAuth'
import { getApplications } from '../../services/applicationStore'

const ROWS_PER_PAGE = 5

function displayStatus(status: string) {
  if (status === 'Draft Submitted') return 'Final Document Upload'
  if (status === 'Under review') return 'DOST Initial Review'
  if (status === 'Technical evaluation') return 'Technical Evaluation'
  return status
}

function statusTone(status: string): 'success' | 'warning' | 'info' | 'danger' {
  if (status === 'Approved') return 'success'
  if (status === 'Returned for Revision') return 'danger'
  if (status === 'Under review' || status === 'Technical evaluation') return 'info'
  return 'warning'
}

function getProposalAction(status: string) {
  if (status === 'Draft Submitted' || status === 'Submitted' || status === 'Returned for Revision') {
    return { label: 'Open Documents', path: 'documents' }
  }

  return { label: 'View Status', path: 'application-status' }
}

export function MyProposalsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const user = getMockUser()
  const registrationPath = user?.program === 'GIA' ? '/programs/gia/register' : '/programs/setup/register'
  const allApplications = getApplications()
  const accountApplications = allApplications.filter((application) =>
    user?.applicationReference
      ? application.referenceNo === user.applicationReference
      : !user?.email || application.contactEmail.toLowerCase() === user.email.toLowerCase(),
  )
  const applications = accountApplications.length || user?.program !== 'SETUP'
    ? accountApplications
    : allApplications.filter((application) => isSampleSetupApplication(application.referenceNo))
  const totalPages = Math.max(1, Math.ceil(applications.length / ROWS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const firstRowIndex = (activePage - 1) * ROWS_PER_PAGE
  const visibleApplications = applications.slice(firstRowIndex, firstRowIndex + ROWS_PER_PAGE)

  return (
    <div className="space-y-7">
      <AdminPageHeader
        action={<Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b]" to={registrationPath}><FilePlus2 className="size-4" />Register Proposal</Link>}
        description="View submitted proposals and continue outstanding requirements."
        eyebrow="Proponent Portal"
        title="My Proposals"
      />

      {applications.length ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-black text-slate-900">Proposal List</h2>
              <p className="mt-0.5 text-xs text-slate-500">{applications.length} proposal{applications.length === 1 ? '' : 's'} in this account</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <caption className="sr-only">Submitted proposals and their current status</caption>
              <thead className="bg-[#f8fbff] text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5" scope="col">Reference Number</th>
                  <th className="px-6 py-3.5" scope="col">Proposal Title</th>
                  <th className="px-4 py-3.5" scope="col">Submitted</th>
                  <th className="px-4 py-3.5" scope="col">Status</th>
                  <th className="px-6 py-3.5 text-right" scope="col">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleApplications.map((application) => {
                  const action = getProposalAction(application.status)
                  const actionTarget = action.path === 'documents'
                    ? `/dashboard/documents?proposal=${encodeURIComponent(application.referenceNo)}`
                    : '/dashboard/application-status'

                  return (
                    <tr className="transition hover:bg-slate-50/80" key={application.id}>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#073b82]">{application.referenceNo}</span>
                          {isSampleSetupApplication(application.referenceNo) ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-700">Sample</span> : null}
                        </div>
                      </td>
                      <td className="max-w-md px-6 py-5 align-middle">
                        <p className="font-bold leading-6 text-slate-900">{application.projectTitle}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-600 align-middle">
                        {new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(application.createdAt))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 align-middle">
                        <StatusPill tone={statusTone(application.status)}>{displayStatus(application.status)}</StatusPill>
                      </td>
                      <td className="px-6 py-5 text-right align-middle">
                        <Link className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-xs font-bold text-[#073b82] transition hover:bg-blue-100" to={actionTarget}>{action.label}<ArrowRight className="size-3.5" /></Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fbfdff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs font-semibold text-slate-500">
              Showing {firstRowIndex + 1}–{Math.min(firstRowIndex + ROWS_PER_PAGE, applications.length)} of {applications.length}
            </p>
            <nav className="flex items-center gap-2" aria-label="Proposal list pagination">
              <button
                aria-label="Previous page"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="inline-flex h-9 min-w-24 items-center justify-center rounded-lg bg-blue-50 px-3 text-xs font-bold text-[#0f53b7]">Page {activePage} of {totalPages}</span>
              <button
                aria-label="Next page"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FolderOpen className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-800">No proposals yet</h2>
          <p className="mt-2 text-sm text-slate-500">Start a simplified online proposal when your enterprise is ready.</p>
          <Link className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white" to={registrationPath}>Register Proposal</Link>
        </div>
      )}
    </div>
  )
}

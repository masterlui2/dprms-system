import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Download,
  Eye,
  FileCheck2,
  FileUp,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { ProposalProgress } from '../../components/proponent/ProposalProgress'
import { getMockUser } from '../../lib/mockAuth'
import {
  deleteDocument,
  documentaryRequirements,
  fileToStoredDocument,
  getDocuments,
  saveDocument,
  type StoredDocument,
  type VerificationStatus,
} from '../../services/documentStore'
import { getSetupApplications } from '../../services/setupProposalStore'
import { updateApplicationStatus } from '../../services/applicationStore'
import { cn } from '../../utils/cn'

const statusClasses: Record<VerificationStatus, string> = {
  'Not Uploaded': 'bg-slate-100 text-slate-600',
  Uploaded: 'bg-blue-50 text-[#0f53b7]',
  'Under Review': 'bg-amber-50 text-amber-700',
  Approved: 'bg-emerald-50 text-emerald-700',
  'Needs Revision': 'bg-red-50 text-red-700',
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocumentaryRequirementsPage() {
  const user = getMockUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const applications = useMemo(() => getSetupApplications().filter((application) =>
    user?.applicationReference
      ? application.referenceNo === user.applicationReference
      : !user?.email || application.contactEmail.toLowerCase() === user.email.toLowerCase(),
  ), [user?.applicationReference, user?.email])
  const requestedReference = searchParams.get('proposal')
  const activeApplication = applications.find((item) => item.referenceNo === requestedReference) ?? applications[0]
  const [documents, setDocuments] = useState<Record<string, StoredDocument>>(() => activeApplication ? getDocuments(activeApplication.referenceNo) : {})
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    setDocuments(activeApplication ? getDocuments(activeApplication.referenceNo) : {})
  }, [activeApplication])

  const completedCount = documentaryRequirements.filter((requirement) => documents[requirement.id]).length
  const requiredComplete = documentaryRequirements.filter((requirement) => requirement.required).every((requirement) => documents[requirement.id])

  async function handleFile(requirementId: string, file?: File) {
    if (!activeApplication || !file) return
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Please select a file smaller than 2 MB for this prototype.')
      return
    }
    try {
      const document = await fileToStoredDocument(file)
      saveDocument(activeApplication.referenceNo, requirementId, document)
      const nextDocuments = getDocuments(activeApplication.referenceNo)
      setDocuments(nextDocuments)
      const allRequiredUploaded = documentaryRequirements
        .filter((requirement) => requirement.required)
        .every((requirement) => nextDocuments[requirement.id])
      if (allRequiredUploaded) updateApplicationStatus(activeApplication.referenceNo, 'Under review')
      setMessage(`${file.name} uploaded successfully.`)
    } catch {
      setMessage('The file could not be saved. Please try a smaller file.')
    }
  }

  function remove(requirementId: string) {
    if (!activeApplication) return
    deleteDocument(activeApplication.referenceNo, requirementId)
    setDocuments(getDocuments(activeApplication.referenceNo))
    updateApplicationStatus(activeApplication.referenceNo, 'Draft Submitted')
    setMessage('File deleted.')
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Upload supporting files after proposal submission. Proposal information is not requested again here."
        eyebrow="SETUP Submission"
        title="Documentary Requirements"
      />

      {!activeApplication ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileCheck2 className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-800">Submit a proposal first</h2>
          <p className="mt-2 text-sm text-slate-500">Document upload becomes available after your SETUP proposal is submitted.</p>
        </div>
      ) : (
        <>
          {applications.length > 1 ? (
            <label className="block max-w-md text-sm font-bold text-slate-700">Proposal
              <select className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setSearchParams({ proposal: event.target.value })} value={activeApplication.referenceNo}>
                {applications.map((application) => <option key={application.id} value={application.referenceNo}>{application.referenceNo} — {application.projectTitle}</option>)}
              </select>
            </label>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-mono text-xs font-bold text-[#0f53b7]">{activeApplication.referenceNo}</p><h2 className="mt-1 text-lg font-black text-slate-900">{activeApplication.projectTitle}</h2></div>
              <div className="min-w-48"><div className="flex justify-between text-xs font-bold text-slate-500"><span>Files uploaded</span><span>{completedCount} of {documentaryRequirements.length}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(completedCount / documentaryRequirements.length) * 100}%` }} /></div></div>
            </div>
            <ProposalProgress application={activeApplication} documentsComplete={requiredComplete} compact />
          </section>

          {message ? <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#073b82]" role="status"><span>{message}</span><button aria-label="Dismiss message" className="ml-3 text-lg" onClick={() => setMessage(null)} type="button">×</button></div> : null}

          <div className="grid gap-4">
            {documentaryRequirements.map((requirement, index) => {
              const document = documents[requirement.id]
              const status: VerificationStatus = document?.verificationStatus ?? 'Not Uploaded'
              return (
                <article className={cn('rounded-2xl border bg-white p-5 shadow-sm transition sm:p-6', document ? 'border-emerald-200' : 'border-slate-200')} key={requirement.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className={cn('grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-black', document ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400')}>
                      {document ? <Check className="size-5" strokeWidth={3} /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{requirement.title}{requirement.required ? <span className="ml-1 text-red-600">*</span> : null}</h3><span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', statusClasses[status])}>{status}</span>{requirement.appliesTo ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{requirement.appliesTo}</span> : null}</div>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{requirement.description}</p>
                      {document ? <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="font-semibold text-slate-700">{document.fileName}</span><span>{formatSize(document.fileSize)}</span><span>Uploaded {new Date(document.uploadedAt).toLocaleString()}</span></div> : <p className="mt-2 text-xs font-medium text-slate-400">PDF, DOCX, JPG or PNG · Maximum 2 MB</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]">
                        {document ? <RefreshCw className="size-3.5" /> : <FileUp className="size-3.5" />}{document ? 'Replace File' : 'Upload'}
                        <input accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => { void handleFile(requirement.id, event.target.files?.[0]); event.target.value = '' }} type="file" />
                      </label>
                      {document ? <>
                        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => window.open(document.dataUrl, '_blank', 'noopener,noreferrer')} type="button"><Eye className="size-3.5" />View File</button>
                        <a className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50" download={document.fileName} href={document.dataUrl}><Download className="size-3.5" />Download</a>
                        <button aria-label={`Delete ${document.fileName}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50" onClick={() => remove(requirement.id)} type="button"><Trash2 className="size-3.5" />Delete</button>
                      </> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

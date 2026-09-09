import { useEffect, useState } from 'react'
import { AlertTriangle, LoaderCircle, ReceiptText } from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { RepaymentLedgerView } from '../../components/admin/RepaymentLedgerView'
import {
  fetchMySetupRepaymentProjects,
  repaymentErrorMessage,
  type SetupRepaymentProject,
} from '../../services/repaymentLedgerStore'

export function RepaymentLedgerPage() {
  const [projects, setProjects] = useState<SetupRepaymentProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchMySetupRepaymentProjects()
      .then((records) => {
        if (!active) return
        setProjects(records)
        setSelectedProjectId(records[0]?.id ?? null)
      })
      .catch((loadError) => {
        if (active) setError(repaymentErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader description="" eyebrow="SETUP" title="Repayment Ledger" />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="mx-auto size-7 text-rose-600" />
          <p className="mt-3 font-bold text-rose-900">Could not load your ledger</p>
          <p className="mt-1 text-sm text-rose-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!selectedProjectId) {
    return (
      <div className="space-y-6">
        <AdminPageHeader description="" eyebrow="SETUP" title="Repayment Ledger" />
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <ReceiptText className="mx-auto size-8 text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">No active repayment project</p>
          <p className="mt-1 text-sm text-slate-500">Your schedule will appear after project activation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {projects.length > 1 ? (
        <label className="ml-auto block max-w-md text-sm font-bold text-slate-700">
          Project
          <select
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setSelectedProjectId(Number(event.target.value))}
            value={selectedProjectId}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.referenceNumber} — {project.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <RepaymentLedgerView key={selectedProjectId} projectId={selectedProjectId} />
    </div>
  )
}

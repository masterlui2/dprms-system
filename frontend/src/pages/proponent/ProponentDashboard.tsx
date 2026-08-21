import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FilePlus2,
  FolderKanban,
  HardDrive,
  Info,
  Wrench,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { MetricCard } from '../../components/admin/MetricCard'
import { ProposalProgress } from '../../components/proponent/ProposalProgress'
import { StatusPill } from '../../components/admin/StatusPill'
import { getMockUser } from '../../lib/mockAuth'
import {
  fetchGiaDocumentaryRequirements,
  fetchSetupDocumentaryRequirements,
  getDocuments,
  type DocumentaryRequirement,
} from '../../services/documentStore'
import { getApplications, syncUserApplicationsFromBackend } from '../../services/applicationStore'
import { getGiaProposal } from '../../services/giaProposalStore'
import { getSetupDraft } from '../../services/setupProposalStore'
import type { ApplicationRecord } from '../../types/application'

type TabType = 'overview' | 'monitoring' | 'equipment' | 'repayment' | 'notifications'

export function ProponentDashboard() {
  const location = useLocation()
  const user = getMockUser()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [allApplications, setAllApplications] = useState<ApplicationRecord[]>(() => getApplications())

  useEffect(() => {
    if (!user) return
    syncUserApplicationsFromBackend(user).then((apps) => {
      if (apps.length > 0) {
        setAllApplications(apps)
      }
    })
  }, [user?.id, user?.email])

  const userProgram = user?.program ?? 'SETUP'

  // Match applications that belong to the logged-in user
  const userApplications = allApplications.filter((app) => {
    if (user?.applicationReference && app.referenceNo === user.applicationReference) {
      return true
    }
    if (user?.email && app.contactEmail.toLowerCase() === user.email.toLowerCase()) {
      return true
    }
    if (user?.name && app.applicantName.toLowerCase() === user.name.toLowerCase()) {
      return true
    }
    return false
  })

  // Pick the active application for the user's current program
  const programApp = userApplications.find((app) => app.program === userProgram)
  const application =
    programApp ??
    userApplications[0] ??
    null

  const documents = application ? getDocuments(application.referenceNo) : {}
  const giaProposal = application?.program === 'GIA' ? getGiaProposal(application?.referenceNo ?? '') : null
  const liveSetup = application?.program === 'SETUP' ? getSetupDraft() : null

  const [requirements, setRequirements] = useState<DocumentaryRequirement[]>([])

  useEffect(() => {
    if (!application) {
      setRequirements([])
      return
    }
    let cancelled = false
    if (application.program === 'SETUP') {
      fetchSetupDocumentaryRequirements(liveSetup?.organizationType, liveSetup?.businessSize)
        .then((records) => { if (!cancelled) setRequirements(records) })
        .catch(() => { if (!cancelled) setRequirements([]) })
    } else {
      fetchGiaDocumentaryRequirements(giaProposal?.proponentCategory)
        .then((records) => { if (!cancelled) setRequirements(records) })
        .catch(() => { if (!cancelled) setRequirements([]) })
    }
    return () => { cancelled = true }
  }, [application?.referenceNo, application?.program, giaProposal?.proponentCategory, liveSetup?.organizationType, liveSetup?.businessSize])

  const requiredRequirements = requirements.filter((req) => req.required)
  const uploadedCount = requiredRequirements.filter((req) => Boolean(documents[req.id])).length
  const documentsComplete =
    requiredRequirements.length > 0 && requiredRequirements.every((req) => Boolean(documents[req.id]))
  const submittedReference = (location.state as { submittedReference?: string } | null)?.submittedReference
  const isApproved = application?.status === 'Approved'
  const isUnderReview = application?.status === 'Under review' || application?.status === 'Submitted' || application?.status === 'Draft Submitted'
  const isGia = application?.program === 'GIA' || user?.program === 'GIA'

  const stage2Description = isGia
    ? 'CEST Officers verify documentary completeness and initial eligibility criteria.'
    : 'SSCP Officers verify documentary completeness and initial eligibility criteria.'

  const TABS = [
    { id: 'overview' as TabType, label: 'Overview & Status', icon: <FolderKanban className="size-4" /> },
    { id: 'monitoring' as TabType, label: 'Project Monitoring', icon: <Activity className="size-4" /> },
    { id: 'equipment' as TabType, label: 'Equipment Tracking', icon: <Wrench className="size-4" /> },
    { id: 'repayment' as TabType, label: 'Repayment & Billing', icon: <CreditCard className="size-4" /> },
    { id: 'notifications' as TabType, label: 'Notifications', icon: <Bell className="size-4" /> },
  ]

  return (
    <div className="space-y-0 pb-8">
      {/* Success banner */}
      {submittedReference ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-black">Proposal submitted successfully</p>
            <p className="mt-1 text-sm">Your application is now active in your workspace.</p>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="pb-5">
        <AdminPageHeader
          action={null}
          description="DOST PSTO Davao Oriental Proponent Management Portal."
          eyebrow={`${user?.program ?? 'DOST'} Proponent Portal`}
          title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        />
      </div>

      {/* Tabs — immediately after header, only shown when application exists */}
      {application && (
        <div className="flex border-b border-slate-200 overflow-x-auto text-sm font-bold mb-6">
          {TABS.map((tab) => (
            <button
              className={`flex items-center gap-2 border-b-2 px-4 py-3 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-[#0f53b7] text-[#0f53b7]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ═══ STATE 1: No application ═════════════════════════════════ */}
      {!application && (
        <section className="flex min-h-[340px] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <FilePlus2 className="size-12 text-[#0f53b7]" />
          <div>
            <h2 className="text-xl font-black text-slate-900">No Active Proposal Application</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-slate-500">
              You have not started a proposal application yet. Click below to open your workspace and begin.
            </p>
          </div>
          <Link
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#0b3f8b]"
            to={isGia ? '/gia/my-proposal' : '/setup/my-application'}
          >
            {isGia ? 'Submit Proposal' : 'Submit Application'} <ArrowRight className="size-4" />
          </Link>
        </section>
      )}

      {/* ═══ STATE 2+: Application exists ═══════════════════════════ */}
      {application && (
        <div className="space-y-5">

          {/* ── OVERVIEW TAB = full dashboard view ─────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Metric cards */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  detail={`Reference: ${application.referenceNo}`}
                  icon={FolderKanban}
                  label="Application Status"
                  value={application.status === 'Draft Submitted' ? 'Stage 1: Proposal Draft' : application.status}
                />
                <MetricCard
                  detail={`${uploadedCount} of ${requiredRequirements.length} required files`}
                  icon={FileCheck2}
                  label="Supporting Documents"
                  tone="sky"
                  value={`${uploadedCount}/${requiredRequirements.length}`}
                />
                <MetricCard
                  detail={isApproved ? 'Active milestones' : isUnderReview ? 'Initial review in progress' : 'Activates upon approval'}
                  icon={Activity}
                  label="Project Monitoring"
                  tone={isApproved ? 'green' : isUnderReview ? 'sky' : 'orange'}
                  value={isApproved ? 'Active' : isUnderReview ? 'In Review' : 'Inactive'}
                />
                <MetricCard
                  detail={isApproved ? 'SETUP refund schedule active' : 'Generated upon MOA signing'}
                  icon={CreditCard}
                  label="Repayment Status"
                  tone={isApproved ? 'green' : 'green'}
                  value={isApproved ? 'Active' : 'Inactive'}
                />
              </section>

              {/* My Proposal Application Overview — status + lifecycle merged */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Header block */}
                <div className="border-b border-slate-100 px-6 py-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f53b7]">
                    {isGia ? 'My Proposal Overview' : 'My Application Overview'}
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{application.program} Application</h2>
                      <p className="mt-0.5 font-mono text-xs font-semibold text-slate-500">{application.referenceNo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone="warning">
                        {application.status === 'Draft Submitted' ? 'Waiting for Supporting Documents' : application.status}
                      </StatusPill>
                      <Link
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3f8b]"
                        to={isGia ? '/gia/my-proposal' : '/setup/my-application'}
                      >
                        {isGia ? 'View My Proposal' : 'View My Application'} <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-5">
                    <ProposalProgress application={application} documentsComplete={documentsComplete} compact />
                  </div>
                </div>

                {/* Program lifecycle — inline row */}
                {isGia ? (
                  <div className="grid divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-[#0f53b7] text-[11px] font-black text-white">1</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">Proposal & Documents</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        Fill out proposal details and attach required business, financial, and organizational documents.
                      </p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">2</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">PSTO Initial Review</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{stage2Description}</p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">3</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">In Process</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        DOST project staff fulfill internal forms and attach technical evaluation documents.
                      </p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">4</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">Approval & Fund Release</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        Provincial Director approval, MOA signing, and project implementation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid divide-y divide-slate-100 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-[#0f53b7] text-[11px] font-black text-white">1</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">Proposal & Documents</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        Fill out proposal details and attach required business, financial, and organizational documents.
                      </p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">2</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">PSTO Initial Review</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{stage2Description}</p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">3</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">Technical Evaluation</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        RTEC conducts technical assessment and site verification.
                      </p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">4</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">In Process</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        DOST project staff fulfill internal forms and attach technical evaluation documents.
                      </p>
                    </div>
                    <div className="p-5">
                      <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-600">5</span>
                      <h4 className="mt-3 text-xs font-bold text-slate-900">Approval & Fund Release</h4>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        Provincial Director approval, MOA signing, and project implementation.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── OTHER TABS ─────────────────────────────────────────── */}
          {activeTab === 'monitoring' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Activity className="size-5" /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Project Monitoring & Progress Milestones</h2>
                  <p className="text-xs text-slate-500">Quarterly technical progress reports and PSTO monitoring logs.</p>
                </div>
              </div>
              <div className="py-10 text-center">
                <Clock className="mx-auto size-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-black text-slate-800">No Active Monitoring Schedule</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">Milestones activate upon DOST approval and project funding.</p>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-600"><Wrench className="size-5" /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Technology Asset & Equipment Inventory</h2>
                  <p className="text-xs text-slate-500">Acquired machinery, serial numbers, and maintenance schedules.</p>
                </div>
              </div>
              <div className="py-10 text-center">
                <HardDrive className="mx-auto size-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-black text-slate-800">No Equipment Recorded</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">Equipment logs are managed here following project execution.</p>
              </div>
            </div>
          )}

          {activeTab === 'repayment' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard className="size-5" /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900">SETUP Refund & Repayment Schedule</h2>
                  <p className="text-xs text-slate-500">Quarterly refund amortization, SOA, and payment records.</p>
                </div>
              </div>
              <div className="py-10 text-center">
                <Info className="mx-auto size-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-black text-slate-800">No Repayment Schedule Yet</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">Refund schedules are generated upon project completion and MOA signing.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600"><Bell className="size-5" /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900">System Notifications & Evaluation Bulletins</h2>
                  <p className="text-xs text-slate-500">Official updates from DOST PSTO officers and reviewers.</p>
                </div>
              </div>
              <div className="py-10 text-center">
                <Bell className="mx-auto size-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-black text-slate-800">No New Notifications</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-6 text-slate-500">You'll be notified when DOST officers evaluate or update your proposal status.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
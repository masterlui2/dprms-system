import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  FileCheck2,
  FileDown,
  Globe2,
  MapPin,
  PenTool,
  QrCode,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Users2,
  X,
} from 'lucide-react'
import {
  computeEmploymentTotals,
  computeProductionCostTotals,
  computeSalesTotals,
  getQuarterRecord,
  saveQuarterRecord,
} from '../../services/setupMonitoringStore'
import type { Quarter, SetupMonitoringQuarterRecord } from '../../types/setupMonitoring'
import { AssetsTab } from './tabs/AssetsTab'
import { DistributionOutletsTab } from './tabs/DistributionOutletsTab'
import { EmploymentTab } from './tabs/EmploymentTab'
import { NarrativeTab } from './tabs/NarrativeTab'
import { ProductionSalesTab } from './tabs/ProductionSalesTab'
import { TechInterventionTab } from './tabs/TechInterventionTab'
import { ExportMonitoringSheetModal } from './ExportMonitoringSheetModal'
import type { ProjectRecord } from '../../data/admin'

type ActiveTab =
  | 'profile'
  | 'production_sales'
  | 'employment'
  | 'assets'
  | 'outlets'
  | 'technology'
  | 'narrative'

interface Props {
  project: ProjectRecord
  initialQuarter?: Quarter
  initialYear?: number
  onBack?: () => void
  readOnly?: boolean
}

export function SetupMonitoringHub({
  project,
  initialQuarter = 'Q2',
  initialYear = 2024,
  onBack,
  readOnly = false,
}: Props) {
  const navigate = useNavigate()
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(initialQuarter)
  const [selectedYear, setSelectedYear] = useState<number>(initialYear)
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [record, setRecord] = useState<SetupMonitoringQuarterRecord>(() =>
    getQuarterRecord(project.id, initialYear, initialQuarter),
  )
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSummarySidebar, setShowSummarySidebar] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now')
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const loaded = getQuarterRecord(project.id, selectedYear, selectedQuarter)
    loaded.enterpriseName = project.enterprise || loaded.enterpriseName
    loaded.enterpriseAddress = project.location || loaded.enterpriseAddress
    setRecord({ ...loaded })
  }, [project.id, selectedYear, selectedQuarter, project.enterprise, project.location])

  const handleRecordChange = (updated: SetupMonitoringQuarterRecord) => {
    setRecord(updated)
    setIsAutoSaving(true)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(() => {
      saveQuarterRecord(updated)
      setIsAutoSaving(false)
      const now = new Date()
      setLastSavedTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )
    }, 400)
  }

  const handleManualSave = () => {
    saveQuarterRecord(record)
    setIsAutoSaving(false)
    const now = new Date()
    setLastSavedTime(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    )
  }

  const salesTotals = computeSalesTotals(record)
  const costTotals = computeProductionCostTotals(record)
  const empTotals = computeEmploymentTotals(record)

  const totalBuildingBookValue = record.buildingAssets.reduce((sum, b) => sum + (b.bookValue || 0), 0)
  const totalEquipmentBookValue = record.equipmentAssets.reduce((sum, eq) => sum + (eq.bookValue || 0), 0)
  const totalFixedAssets = totalBuildingBookValue + totalEquipmentBookValue

  const totalGrant = project.budget || 1500000
  const totalRefunded = project.used || 250000
  const refundPercentage = Math.min(100, Math.round((totalRefunded / totalGrant) * 100))

  const tabs: Array<{
    id: ActiveTab
    label: string
    icon: typeof Building2
  }> = [
    {
      id: 'profile',
      label: 'Profile & Details',
      icon: Store,
    },
    {
      id: 'production_sales',
      label: 'Production & Sales',
      icon: TrendingUp,
    },
    {
      id: 'employment',
      label: 'Employment',
      icon: Users2,
    },
    {
      id: 'assets',
      label: 'Assets & Capital',
      icon: Building2,
    },
    {
      id: 'outlets',
      label: 'Distribution Outlets',
      icon: Globe2,
    },
    {
      id: 'technology',
      label: 'Technology Intervention',
      icon: Sparkles,
    },
    {
      id: 'narrative',
      label: 'Narrative & Sign-off',
      icon: PenTool,
    },
  ]

  const activeTabTitle = tabs.find((t) => t.id === activeTab)?.label || 'Quarterly Monitoring'

  return (
    <div className="w-full space-y-5 pb-20 font-sans">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            {onBack && (
              <button
                onClick={onBack}
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] bg-[#E6EEF4]/50 text-[#285497] transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95 shadow-2xs"
                title="Back to monitored projects"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {project.enterprise || project.title || record.enterpriseName}
                </h1>
                <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 font-mono text-xs font-bold text-[#285497]">
                  {project.referenceNumber || project.id}
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0f53b7] border border-blue-200">
                  {project.program || 'SETUP'} Track
                </span>
                {project.proposalId ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Online Application
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                    Active Project
                  </span>
                )}
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  🟢 Newly Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                DOST Regional Monitoring Hub · <span className="text-[#285497] font-bold">{activeTabTitle}</span> · Cycle {selectedQuarter} {selectedYear}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {project.proposalId ? (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/document-checklist?proposalId=${project.proposalId}&program=SETUP`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-[#0f53b7] active:scale-95"
                title="Open Master Document Checklist"
              >
                <FileCheck2 className="size-4 text-[#0f53b7]" />
                <span>Master Checklist</span>
              </button>
            ) : null}

            {/* Quarter Selector Dropdown */}
            <select
              value={`${selectedQuarter} ${selectedYear}`}
              onChange={(e) => {
                const [q, y] = e.target.value.split(' ')
                setSelectedQuarter(q as Quarter)
                setSelectedYear(Number(y))
              }}
              className="h-9 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs focus:border-[#0f53b7] focus:outline-none cursor-pointer"
            >
              <option value="Q3 2024">3rd Quarter (Q3 2024)</option>
              <option value="Q2 2024">2nd Quarter (Q2 2024)</option>
              <option value="Q1 2024">1st Quarter (Q1 2024)</option>
            </select>

            {/* Summary Metrics Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSummarySidebar(!showSummarySidebar)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition shadow-2xs active:scale-95 ${
                showSummarySidebar
                  ? 'border-[#0f53b7] bg-[#0f53b7] text-white shadow-md'
                  : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-[#E6EEF4] hover:text-[#285497]'
              }`}
              title="Toggle Live Summary Sidebar"
            >
              <BarChart3 className="size-4" />
              <span>Summary KPI</span>
            </button>

            {/* Save Snapshot Button */}
            <button
              type="button"
              onClick={handleManualSave}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 shadow-2xs transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95"
              title="Save Snapshot"
            >
              <SlidersHorizontal className="size-4" />
            </button>

            {/* Generate Report / Export Button */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-95"
            >
              <FileDown className="size-4" />
              <span>Export Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Autosave Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#B5BFCD]/50 pb-0.5">
        <div className="flex max-w-full items-center gap-6 overflow-x-auto scrollbar-none pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative inline-flex shrink-0 items-center gap-2 pb-2.5 text-xs transition-all duration-150 ease-out ${
                  isActive
                    ? 'font-bold text-[#0f53b7] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0f53b7] after:rounded-full'
                    : 'font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? 'text-[#0f53b7]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 pb-2 pr-1">
          {isAutoSaving ? (
            <>
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Saving draft...</span>
            </>
          ) : (
            <>
              <Check className="size-3 text-emerald-600" />
              <span>Autosaved {lastSavedTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Layout with Optional Summary Sidebar */}
      <div className="flex items-start gap-5">
        {/* Left: Active Tab Content */}
        <div className="min-w-0 flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Executive Operational KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/70 to-emerald-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Approved Grant & Balance</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {refundPercentage}% Refunded
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-emerald-950">
                      ₱{(totalGrant - totalRefunded).toLocaleString()}
                    </p>
                    <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
                      of ₱{totalGrant.toLocaleString()} total grant
                    </span>
                  </div>
                  <div className="mt-3.5 h-1.5 w-full rounded-full bg-emerald-200/70 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${refundPercentage}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200/80 bg-linear-to-br from-blue-50/70 to-blue-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0f53b7]">Active Monitoring Cycle</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0f53b7]">
                        {selectedQuarter} {selectedYear}
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-slate-900">Oct 15, 2026</p>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                      Next Quarterly Data Sheet Due
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Schedule On Track</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-200/80 bg-linear-to-br from-purple-50/70 to-purple-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">Equipment Outlay</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        {record.equipmentAssets.length || 3} Units
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-purple-950">QR Tagged</p>
                    <span className="text-[11px] font-semibold text-purple-700 mt-0.5 block">
                      Verified Machinery Inventory
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-purple-800">
                    <QrCode className="size-3.5" />
                    <span>Inspection Ready</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100/50 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Master Checklist</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        92% Complied
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-slate-900">SET 1 Verified</p>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                      Legal & Audit Clearance Satisfied
                    </span>
                  </div>
                  {project.proposalId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/document-checklist?proposalId=${project.proposalId}&program=SETUP`)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
                    >
                      <span>Open Master Checklist</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 2-Column Comprehensive Dossier */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Column 1: Enterprise Legal Identity & Ownership */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#0f53b7]">
                        <Building2 className="size-4.5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Enterprise Legal Profile</h3>
                        <p className="text-xs text-slate-500">Business registration and proponent background</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      ✓ Auto-Inherited
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Registered Enterprise Name</span>
                      <p className="mt-1 text-sm font-bold text-slate-900">{project.enterprise || project.title || record.enterpriseName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Proponent / Lead Person</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.manager || 'Maria SETUP Proponent'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Priority Industry Sector</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">Food Processing (Agri-Commodities)</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Business Structure & Scale</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">Sole Proprietorship · Micro Enterprise</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Information</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">+63 917 123 4567</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Manufacturing & Operating Facility</span>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <MapPin className="size-3.5 text-[#0f53b7] shrink-0" />
                        <span>{project.location || record.enterpriseAddress || 'Davao del Sur, Region XI'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Program Operations & Monitoring Mandate */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                        <ShieldCheck className="size-4.5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Program Directives & Mandate</h3>
                        <p className="text-xs text-slate-500">DOST execution terms and monitoring supervision</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0f53b7] border border-blue-200">
                      Active Execution
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">DOST Reference / Resolution No.</span>
                      <p className="mt-1 text-sm font-mono font-black text-[#0f53b7]">{project.referenceNumber || project.id}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned Monitoring Officer</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.manager || 'Maria SETUP Proponent'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">PSTO Implementing Center</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">DOST PSTO {project.district || 'Davao del Sur'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TNA Evaluation Status</span>
                        <p className="mt-1 text-xs font-bold text-emerald-700">✓ Form 01 & 04 Certified</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Refund Term Duration</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">36 Months (3 Years)</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Environmental & GAD Assessment</span>
                        <p className="mt-0.5 text-xs font-bold text-slate-800">HazardHunter & GWP Checklist Complied</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Cleared
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Outlay & Inventory Table Preview */}
              <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                      <QrCode className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Deployed Equipment & Machinery Inventory</h3>
                      <p className="text-xs text-slate-500">QR-tagged capital assets acquired under SETUP grant</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assets')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0f53b7] hover:underline"
                  >
                    <span>View Assets Tab</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Equipment Description</th>
                        <th className="py-2.5 px-3 text-center">Acquisition</th>
                        <th className="py-2.5 px-3 text-center">Useful Life</th>
                        <th className="py-2.5 px-3 text-right">Acquisition Cost</th>
                        <th className="py-2.5 px-3 text-right">Book Value</th>
                        <th className="py-2.5 px-3 text-center">QR & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(record.equipmentAssets.length > 0
                        ? record.equipmentAssets
                        : [
                            { id: 'eq_1', equipmentName: 'Heavy-Duty Stainless Steel Grinder & Pulverizer', equipmentType: 'Machinery', usefulLifeYears: 10, yearAcquired: 2024, cost: 450000, depreciation: 0, bookValue: 450000 },
                            { id: 'eq_2', equipmentName: 'Continuous Band Sealer with Gas Flushing Unit', equipmentType: 'Packaging', usefulLifeYears: 8, yearAcquired: 2024, cost: 180000, depreciation: 0, bookValue: 180000 },
                            { id: 'eq_3', equipmentName: 'Automated Temperature Controlled Roasting Machine', equipmentType: 'Processing', usefulLifeYears: 10, yearAcquired: 2024, cost: 320000, depreciation: 0, bookValue: 320000 },
                          ]
                      ).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-[#0f53b7]" />
                            <span>{item.equipmentName}</span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-mono">{item.yearAcquired || 2024}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{item.usefulLifeYears || 5} yrs</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">₱{(item.cost || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#0f53b7]">₱{(item.bookValue || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              ✓ Operational
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Direct Operational Navigation Shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="size-2 rounded-full bg-[#0f53b7]" />
                  <span>Ready to input quarterly monitoring logs?</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('production_sales')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-95"
                  >
                    <span>Proceed to Production & Sales</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'production_sales' && (
            <ProductionSalesTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'employment' && (
            <EmploymentTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'assets' && (
            <AssetsTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'outlets' && (
            <DistributionOutletsTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'technology' && (
            <TechInterventionTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'narrative' && (
            <NarrativeTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Right: Live Summary KPI Sidebar (Contextual for Active Tab) */}
        {showSummarySidebar && (
          <aside className="w-80 shrink-0 rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeTabTitle} Summary</h3>
                <p className="text-xs text-slate-400 font-normal">{record.quarter} {record.year} · {record.enterpriseName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSummarySidebar(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* TAB 1: PRODUCTION & SALES */}
            {activeTab === 'production_sales' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Overview</span>
                    <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                      {salesTotals.profitMargin}% Margin
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Grand Total Sales:</span>
                      <span className="font-bold text-slate-900">₱{salesTotals.grandTotalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Grand Total Cost:</span>
                      <span className="font-bold text-slate-900">₱{costTotals.grandTotalProductionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Net Profit:</span>
                      <span className="font-black text-[#285497]">₱{salesTotals.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cost Structure</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Operating Expenses:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.operatingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Direct Labor:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Raw Materials:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.rawMaterialsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Miscellaneous:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.miscTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMPLOYMENT */}
            {activeTab === 'employment' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workforce Headcount</span>
                    <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                      {empTotals.totalEmployees} Total
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">MALE</span>
                      <span className="text-lg font-black text-[#285497]">{empTotals.maleCount}</span>
                    </div>
                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">FEMALE</span>
                      <span className="text-lg font-black text-[#285497]">{empTotals.femaleCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Roster Distribution</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Direct Employees:</span>
                      <span className="font-semibold text-slate-900">{record.directEmployees.length} staff</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Indirect Employees:</span>
                      <span className="font-semibold text-slate-900">{record.indirectEmployees.length} staff</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#B5BFCD]/50 pt-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sectoral Inclusivity</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Youth:</span>
                      <span className="font-semibold text-slate-900">{empTotals.youthCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Senior Citizens (SC):</span>
                      <span className="font-semibold text-slate-900">{empTotals.scCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>PWD:</span>
                      <span className="font-semibold text-slate-900">{empTotals.pwdCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ASSETS & CAPITAL */}
            {activeTab === 'assets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fixed Asset Value</span>
                  <div className="rounded-xl border border-[#285497]/40 bg-[#E6EEF4] p-3 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Combined Net Valuation</span>
                    <span className="text-xl font-black text-[#285497]">
                      ₱{totalFixedAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Asset Category Summary</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Building Book Value:</span>
                      <span className="font-semibold text-slate-900">₱{totalBuildingBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Equipment Book Value:</span>
                      <span className="font-semibold text-slate-900">₱{totalEquipmentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Working Capital Outlay:</span>
                      <span className="font-semibold text-slate-900">
                        ₱{record.workingCapital.reduce((sum, w) => sum + (w.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DISTRIBUTION OUTLETS */}
            {activeTab === 'outlets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Market Coverage</span>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">International Markets:</span>
                      <span className="font-bold text-slate-900">{record.internationalMarkets?.length || 0} outlets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Local Market Outlets:</span>
                      <span className="font-bold text-slate-900">{record.localMarkets?.length || 0} outlets</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Total Distribution Reach:</span>
                      <span className="font-black text-[#285497]">
                        {(record.internationalMarkets?.length || 0) + (record.localMarkets?.length || 0)} channels
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Supply & Forward Network</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Forward Distributors:</span>
                      <span className="font-semibold text-slate-900">{record.forwardDistributors?.length || 0} entities</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Raw Material Suppliers:</span>
                      <span className="font-semibold text-slate-900">{record.forwardSuppliers?.length || 0} partners</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TECHNOLOGY INTERVENTION */}
            {activeTab === 'technology' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Intervention Portfolio</span>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Consultancy Services:</span>
                      <span className="font-bold text-slate-900">{record.consultancies?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Trainings Conducted:</span>
                      <span className="font-bold text-slate-900">{record.trainings?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Technology Transfers:</span>
                      <span className="font-bold text-slate-900">{record.techTransfers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Support & Testing Services:</span>
                      <span className="font-bold text-slate-900">{record.supportServices?.length || 0}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Other DOST Projects:</span>
                      <span className="font-black text-[#285497]">{record.otherProjects?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: NARRATIVE & SIGN-OFF */}
            {activeTab === 'narrative' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Validation Status</span>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Interviewer Sign-off:</span>
                      <span className="font-bold text-slate-900">{record.signOff?.interviewerName ? 'Completed' : 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Respondent Acknowledgment:</span>
                      <span className="font-bold text-slate-900">{record.signOff?.respondentName ? 'Completed' : 'Pending'}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Sheet Status:</span>
                      <span className="font-black text-[#285497]">{record.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Official Sheet Export Modal */}
      {showExportModal && (
        <ExportMonitoringSheetModal
          record={record}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}

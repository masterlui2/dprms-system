import { useEffect, useState, useRef } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Check,
  FileDown,
  Globe2,
  PenTool,
  SlidersHorizontal,
  Sparkles,
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
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(initialQuarter)
  const [selectedYear, setSelectedYear] = useState<number>(initialYear)
  const [activeTab, setActiveTab] = useState<ActiveTab>('production_sales')
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

  const tabs: Array<{
    id: ActiveTab
    label: string
    icon: typeof Building2
  }> = [
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
      {/* Top Header Card with Integrated Navigation Tabs */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] bg-[#E6EEF4]/50 text-[#285497] transition hover:bg-[#E6EEF4] hover:text-[#285497]"
                title="Back to monitored projects"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {project.enterprise || project.title || record.enterpriseName}
                </h1>
                <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-bold text-[#285497]">
                  {project.referenceNumber || project.id}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Quarterly Monitoring Data Sheet · <span className="text-[#285497] font-bold">{activeTabTitle}</span> · {selectedQuarter} {selectedYear}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quarter Selector Dropdown */}
            <select
              value={`${selectedQuarter} ${selectedYear}`}
              onChange={(e) => {
                const [q, y] = e.target.value.split(' ')
                setSelectedQuarter(q as Quarter)
                setSelectedYear(Number(y))
              }}
              className="h-8.5 rounded-xl border border-[#B5BFCD] bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-[#0f53b7] focus:outline-none cursor-pointer"
            >
              <option value="Q3 2024">3rd Quarter (Q3 2024)</option>
              <option value="Q2 2024">2nd Quarter (Q2 2024)</option>
              <option value="Q1 2024">1st Quarter (Q1 2024)</option>
            </select>

            {/* Summary Metrics Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSummarySidebar(!showSummarySidebar)}
              className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition shadow-sm active:scale-95 ${
                showSummarySidebar
                  ? 'border-[#0f53b7] bg-[#0f53b7] text-white shadow-md'
                  : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-[#E6EEF4] hover:text-[#285497]'
              }`}
              title="Toggle Live Summary Sidebar"
            >
              <BarChart3 className="size-3.5" />
              <span>Summary KPI</span>
            </button>

            {/* Save Snapshot Button */}
            <button
              type="button"
              onClick={handleManualSave}
              className="inline-flex size-8.5 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95"
              title="Save Snapshot"
            >
              <SlidersHorizontal className="size-3.5" />
            </button>

            {/* Generate Report / Export Button */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:bg-[#0f53b7] active:text-white active:scale-95"
            >
              <FileDown className="size-3.5 text-[#285497]" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Line-Style Navigation Tabs & Autosave Label (Open, no outline/fill) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#B5BFCD]/50 pb-0.5">
        <div className="flex max-w-full items-center gap-6 overflow-x-auto scrollbar-none pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative inline-flex shrink-0 items-center pb-2 text-xs transition-all duration-150 ease-out ${
                  isActive
                    ? 'font-bold text-[#0f53b7] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0f53b7] after:rounded-full'
                    : 'font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
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
        {/* Left: Active Tab Content (Full Width) */}
        <div className="min-w-0 flex-1 space-y-6">
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

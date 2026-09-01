import { useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Check,
  FileDown,
  X,
} from 'lucide-react'

import { formatCurrency, type ProjectRecord } from '../../data/admin'
import { GiaMonitoringForm } from './GiaMonitoringForm'

interface Props {
  project: ProjectRecord
  onBack?: () => void
  readOnly?: boolean
}

export function GiaMonitoringHub({ project, onBack, readOnly = false }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('CY 2026 (Semi-Annual)')
  const [showSummarySidebar, setShowSummarySidebar] = useState(false)
  const [isAutoSaving] = useState(false)
  const [lastSavedTime] = useState('just now')
  const gia = project.gia
  const hasPersistedProject = project.backendId !== undefined

  return (
    <div className="w-full space-y-4 pb-20 font-sans text-slate-900">
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
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
                  {project.enterprise || project.title}
                </h1>
                <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-bold text-[#285497]">
                  {project.id}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                DOST-GIA Form 10 · <span className="text-[#285497] font-bold">Executive Summary of Technical Progress Report</span> · {selectedPeriod}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-8.5 rounded-xl border border-[#B5BFCD] bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-[#0f53b7] focus:outline-none cursor-pointer"
            >
              <option value="CY 2026 (Semi-Annual)">CY 2026 (Semi-Annual)</option>
              <option value="CY 2026 (Quarterly)">CY 2026 (Quarterly)</option>
              <option value="CY 2025 (Annual)">CY 2025 (Annual)</option>
            </select>

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

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:bg-[#0f53b7] active:text-white active:scale-95"
            >
              <FileDown className="size-3.5 text-[#285497]" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pr-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
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

      <div className="flex items-start gap-5">
        <div className="min-w-0 flex-1 overflow-hidden">
          <GiaMonitoringForm
            project={project}
            onBack={onBack || (() => {})}
            hideTopBar={true}
            readOnly={readOnly}
          />
        </div>

        {showSummarySidebar && (
          <aside className="w-80 shrink-0 rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">GIA (CEST) Summary</h3>
                <p className="text-xs text-slate-400 font-normal">{project.id} · {project.enterprise || project.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSummarySidebar(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grant Allocation</span>
                <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                  {project.status || 'Active'}
                </span>
              </div>
              <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Grant Budget:</span>
                  <span className="font-bold text-[#0f53b7]">
                    {project.budget > 0 ? formatCurrency(project.budget) : 'Not recorded'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Implementing Agency:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[140px]">{gia?.agency || project.enterprise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Project Leader:</span>
                  <span className="font-bold text-slate-900">{project.manager || 'Dr. Kevin Lim'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">6Ps Deliverables Target</span>
              <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2.5 text-xs">
                {(gia?.outputs || [
                  { category: 'P1 Publications', target: 2, actual: 1 },
                  { category: 'P2 Patents / IP', target: 1, actual: 0 },
                  { category: 'P3 Products', target: 3, actual: 2 },
                  { category: 'P4 People Services', target: 120, actual: 85 },
                  { category: 'P5 Places / LGUs', target: 4, actual: 3 },
                  { category: 'P6 Policies', target: 1, actual: 1 },
                ]).map((o, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium truncate">{o.category}</span>
                    <span className="font-bold text-[#0f53b7]">{o.actual} / {o.target}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Beneficiary Sector Inclusion</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                  <span className="text-[10px] text-slate-400 block truncate">Farmers / Fisherfolk</span>
                  <strong className="text-sm font-bold text-slate-900">{hasPersistedProject ? 'Not reported' : '210 (44%)'}</strong>
                </div>
                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                  <span className="text-[10px] text-slate-400 block truncate">Women's Groups</span>
                  <strong className="text-sm font-bold text-slate-900">{hasPersistedProject ? 'Not reported' : '145 (30%)'}</strong>
                </div>
                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                  <span className="text-[10px] text-slate-400 block truncate">Cooperatives / MSME</span>
                  <strong className="text-sm font-bold text-slate-900">{hasPersistedProject ? 'Not reported' : '70 (15%)'}</strong>
                </div>
                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                  <span className="text-[10px] text-slate-400 block truncate">Indigenous (IPs)</span>
                  <strong className="text-sm font-bold text-slate-900">{hasPersistedProject ? 'Not reported' : '55 (11%)'}</strong>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

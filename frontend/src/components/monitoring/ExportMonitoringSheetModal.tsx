import { useState } from 'react'
import {
  Building2,
  Coins,
  FileText,
  Globe2,
  Package,
  Printer,
  Sparkles,
  TrendingUp,
  Users2,
  X,
} from 'lucide-react'
import type { Quarter, SetupMonitoringQuarterRecord } from '../../types/setupMonitoring'
import {
  computeEmploymentTotals,
  computeProductionCostTotals,
  computeSalesTotals,
  getQuarterRecord,
} from '../../services/setupMonitoringStore'
import { formatCurrency } from '../../data/admin'

interface Props {
  record: SetupMonitoringQuarterRecord
  onClose: () => void
}

export function ExportMonitoringSheetModal({ record: initialRecord, onClose }: Props) {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(initialRecord.quarter)
  const [selectedYear, setSelectedYear] = useState<number>(initialRecord.year)

  const record = getQuarterRecord(initialRecord.projectId, selectedYear, selectedQuarter)
  record.enterpriseName = initialRecord.enterpriseName || record.enterpriseName
  record.enterpriseAddress = initialRecord.enterpriseAddress || record.enterpriseAddress

  const salesTotals = computeSalesTotals(record)
  const costTotals = computeProductionCostTotals(record)
  const empTotals = computeEmploymentTotals(record)

  const totalBuildingBookValue = record.buildingAssets.reduce((sum, b) => sum + (b.bookValue || 0), 0)
  const totalEquipmentBookValue = record.equipmentAssets.reduce((sum, eq) => sum + (eq.bookValue || 0), 0)
  const totalWorkingCapital = record.workingCapital.reduce((sum, wc) => sum + (wc.amount || 0), 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 bg-[#f8fbff]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Full Quarterly Project Monitoring Report
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {record.enterpriseName} · DOST SETUP Official Complete Monitoring Package
              </p>
            </div>
          </div>

          {/* Quarter & Year Selector + Action Controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center rounded-xl border border-[#B5BFCD] bg-white px-2.5 py-1 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 mr-2">Quarter:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value as Quarter)}
                className="text-xs font-bold text-[#285497] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="Q1">1st Quarter (Q1)</option>
                <option value="Q2">2nd Quarter (Q2)</option>
                <option value="Q3">3rd Quarter (Q3)</option>
                <option value="Q4">4th Quarter (Q4)</option>
              </select>
            </div>

            <div className="flex items-center rounded-xl border border-[#B5BFCD] bg-white px-2.5 py-1 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 mr-2">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-bold text-[#285497] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c4496] shadow-sm transition active:scale-95"
            >
              <Printer className="size-4" /> Print Full Report (PDF)
            </button>
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Printable Complete Report Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-800 text-xs leading-relaxed font-sans bg-white print:p-0 print:overflow-visible">
          {/* Official Government Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <p className="font-bold text-[11px] uppercase tracking-widest text-slate-500">
              Republic of the Philippines · Department of Science and Technology
            </p>
            <h1 className="text-lg font-black uppercase text-slate-900 mt-1">
              Small Enterprise Technology Upgrading Program (SETUP)
            </h1>
            <p className="text-xs font-bold text-[#285497] tracking-wider uppercase">
              Comprehensive Quarterly Project Monitoring Report & Data Package
            </p>
          </div>

          {/* Project Metadata Card */}
          <div className="grid grid-cols-2 gap-4 border border-[#B5BFCD]/80 p-4 rounded-xl bg-[#f8fbff]">
            <div>
              <p>
                <strong className="text-slate-900">ENTERPRISE NAME:</strong>{' '}
                <span className="font-bold text-[#285497]">{record.enterpriseName}</span>
              </p>
              <p className="mt-1">
                <strong className="text-slate-900">BUSINESS ADDRESS:</strong> {record.enterpriseAddress}
              </p>
              <p className="mt-1">
                <strong className="text-slate-900">PERIOD COVERED:</strong>{' '}
                <span className="font-bold">{record.quarter} {record.year}</span>
              </p>
            </div>
            <div>
              <p>
                <strong className="text-slate-900">PROJECT ID:</strong>{' '}
                <span className="font-mono font-bold text-slate-900">{record.projectId}</span>
              </p>
              <p className="mt-1">
                <strong className="text-slate-900">DATE OF MONITORING VISIT:</strong> {record.dateOfVisit}
              </p>
              <p className="mt-1">
                <strong className="text-slate-900">VERIFICATION STATUS:</strong>{' '}
                <span className="inline-flex rounded-full bg-[#E6EEF4] px-2.5 py-0.5 text-[11px] font-bold text-[#285497]">
                  {record.status}
                </span>
              </p>
            </div>
          </div>

          {/* Section 1: Production & Sales Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <TrendingUp className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                1. Quarterly Production, Sales & Financial Performance
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Gross Sales (Quarter)</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(salesTotals.grandTotalSales)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Total Production Cost</p>
                <p className="font-bold text-xs text-rose-600 mt-0.5">
                  {formatCurrency(costTotals.grandTotalProductionCost)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Net Profit</p>
                <p className="font-bold text-xs text-emerald-600 mt-0.5">
                  {formatCurrency(salesTotals.netProfit)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Profit Margin</p>
                <p className="font-bold text-xs text-[#0f53b7] mt-0.5">
                  {salesTotals.profitMargin}%
                </p>
              </div>
            </div>

            {record.sales.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[#B5BFCD]">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#E6EEF4] text-[#285497] font-bold border-b border-[#B5BFCD]">
                    <tr>
                      <th className="p-2">Product Name</th>
                      <th className="p-2">Specifications</th>
                      <th className="p-2 text-center">Unit</th>
                      <th className="p-2 text-right">Selling Price / Unit</th>
                      <th className="p-2 text-center">Quantity</th>
                      <th className="p-2 text-right bg-[#B5BFCD]/30">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {record.sales.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 font-medium">{p.productName}</td>
                        <td className="p-2 text-slate-500">{p.specifications || '-'}</td>
                        <td className="p-2 text-center">{p.unit || 'pcs'}</td>
                        <td className="p-2 text-right">₱{p.sellingPrice.toLocaleString()}</td>
                        <td className="p-2 text-center">{p.quantity.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-[#285497] bg-[#B5BFCD]/15">
                          ₱{(p.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Production Cost Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <Coins className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                2. Detailed Production Costs Breakdown
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Overhead & Operating</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(costTotals.operatingTotal)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Direct Labor Wages</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(costTotals.laborTotal)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Raw Materials (3 Mo.)</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(costTotals.rawMaterialsTotal)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Miscellaneous Expenses</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(costTotals.miscTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Workforce & Employment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <Users2 className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                3. Employment Generated & Workforce Inclusivity
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-800">Headcount Overview</p>
                <p className="mt-1">
                  Direct Workers: <strong>{record.directEmployees.length}</strong>
                </p>
                <p>
                  Indirect Staff: <strong>{record.indirectEmployees.length}</strong>
                </p>
                <p className="mt-1 font-bold text-[#285497]">
                  Total Employees: {empTotals.totalEmployees}
                </p>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-800">Demographic Breakdown</p>
                <p className="mt-1">
                  Sex: <strong>{empTotals.maleCount} Male</strong> / <strong>{empTotals.femaleCount} Female</strong>
                </p>
                <p>
                  Youth (&lt;20 yo): <strong>{empTotals.youthCount}</strong>
                </p>
                <p>
                  Senior Citizens: <strong>{empTotals.scCount}</strong> · PWD: <strong>{empTotals.pwdCount}</strong>
                </p>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-800">Quarterly Payroll</p>
                <p className="mt-1">
                  Direct Wages: <strong>{formatCurrency(empTotals.directSalaryTotal)}</strong>
                </p>
                <p>
                  Indirect Wages: <strong>{formatCurrency(empTotals.indirectSalaryTotal)}</strong>
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  Total Payroll: {formatCurrency(empTotals.directSalaryTotal + empTotals.indirectSalaryTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Assets & Capital */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <Building2 className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                4. Capital Assets & Working Capital
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Building Book Value</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(totalBuildingBookValue)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Equipment Book Value</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(totalEquipmentBookValue)}
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500">Total Working Capital</p>
                <p className="font-bold text-xs text-slate-900 mt-0.5">
                  {formatCurrency(totalWorkingCapital)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Market Distribution Outlets */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <Globe2 className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                5. Distribution Channels & Market Outlets
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-800">Local Market Outlets ({record.localMarkets.length})</p>
                {record.localMarkets.length > 0 ? (
                  <ul className="mt-1.5 space-y-1 text-slate-600">
                    {record.localMarkets.slice(0, 3).map((m) => (
                      <li key={m.id} className="truncate">
                        • <strong>{m.marketName}</strong> ({m.address}) — {m.volumeDelivered}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-400 italic">No local outlets recorded.</p>
                )}
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-800">International Clients ({record.internationalMarkets.length})</p>
                {record.internationalMarkets.length > 0 ? (
                  <ul className="mt-1.5 space-y-1 text-slate-600">
                    {record.internationalMarkets.slice(0, 3).map((m) => (
                      <li key={m.id} className="truncate">
                        • <strong>{m.marketName}</strong> ({m.address}) — {m.volumeDelivered}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-400 italic">No direct international exports recorded this quarter.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Technology Interventions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <Sparkles className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                6. Technology Interventions & Technical Assistance
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Consultancy Services</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {record.consultancies.filter((c) => c.availed).length} Availed
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Trainings Conducted</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {record.trainings.length} Programs
                </p>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                <p className="text-slate-500 font-semibold">Support Services & Testing</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {record.supportServices.length} Test Batches
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: Narrative Assessment & Sign-Off */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#285497]/40 pb-1">
              <Package className="size-4 text-[#285497]" />
              <h3 className="font-black text-sm uppercase text-[#285497]">
                7. Qualitative Assessment & Recommendations
              </h3>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-[11px] space-y-2">
              <div>
                <strong className="text-slate-900">Technical & Production Findings:</strong>
                <p className="text-slate-600 mt-0.5">
                  {record.problemsAndActions.technical || 'Operations and technology utilization are proceeding according to the approved Project Implementation Schedule.'}
                </p>
              </div>
              <div>
                <strong className="text-slate-900">Future Improvement Plans:</strong>
                <p className="text-slate-600 mt-0.5">
                  {record.plansForImprovement.technical || 'Enterprise plans continuous optimization of throughput and GMP compliance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 8: Sign-offs */}
          <div className="pt-6 border-t-2 border-slate-200">
            <div className="grid grid-cols-2 gap-12 text-center text-xs">
              <div>
                <p className="font-bold uppercase text-slate-500">Prepared & Verified By (Interviewer / PSTO Staff):</p>
                <div className="mt-8 border-b border-slate-400 pb-1 font-black text-slate-900 uppercase">
                  {record.signOff.interviewerName || 'DOST-PSTO PERSONNEL'}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {record.signOff.interviewerDesignation || 'DOST-PSTO Project Focal'} · {record.signOff.dateOfVisit || record.dateOfVisit}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase text-slate-500">Confirmed & Acknowledged By (Respondent):</p>
                <div className="mt-8 border-b border-slate-400 pb-1 font-black text-slate-900 uppercase">
                  {record.signOff.respondentName || 'ENTERPRISE REPRESENTATIVE'}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {record.signOff.respondentDesignation || 'Authorized Representative'} · {record.signOff.dateOfVisit || record.dateOfVisit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

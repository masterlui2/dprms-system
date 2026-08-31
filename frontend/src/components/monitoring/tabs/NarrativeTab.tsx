import { AlertCircle, FileCheck, Lightbulb } from 'lucide-react'
import type {
  NarrativeItem,
  SetupMonitoringQuarterRecord,
  SignOffMetadata,
} from '../../../types/setupMonitoring'

interface Props {
  record: SetupMonitoringQuarterRecord
  onChange: (record: SetupMonitoringQuarterRecord) => void
  readOnly?: boolean
}

export function NarrativeTab({ record, onChange, readOnly = false }: Props) {
  const handleUpdateProblems = (field: keyof NarrativeItem, val: string) => {
    onChange({
      ...record,
      problemsAndActions: {
        ...record.problemsAndActions,
        [field]: val,
      },
    })
  }

  const handleUpdatePlans = (field: keyof NarrativeItem, val: string) => {
    onChange({
      ...record,
      plansForImprovement: {
        ...record.plansForImprovement,
        [field]: val,
      },
    })
  }

  const handleSignOffChange = (field: keyof SignOffMetadata, val: string) => {
    onChange({
      ...record,
      signOff: {
        ...record.signOff,
        [field]: val,
      },
    })
  }

  const problemsDimensions: Array<{ key: keyof NarrativeItem; title: string }> = [
    {
      key: 'humanResource',
      title: '1. HUMAN RESOURCE',
    },
    {
      key: 'technical',
      title: '2. TECHNICAL (Machines and Operations)',
    },
    {
      key: 'financial',
      title: '3. FINANCIAL (Issues involving the working capital, repayment and others) >',
    },
    {
      key: 'market',
      title: '4. MARKET (Issues on demand, supply, distributorship and prices of raw materials)',
    },
  ]

  const plansDimensions: Array<{ key: keyof NarrativeItem; title: string }> = [
    {
      key: 'humanResource',
      title: '1. HUMAN RESOURCE (Plans on hiring, training, wage increase)',
    },
    {
      key: 'technical',
      title: '2. TECHNICAL (Plans on procurement of equipment, availment of consultancy service)',
    },
    {
      key: 'financial',
      title: '3. FINANCIAL (Plans on investment, loans, etc.)',
    },
    {
      key: 'market',
      title: '4. MARKET (Plans on market expansion and other matters pertaining to market growth)',
    },
  ]

  return (
    <div className="space-y-8">
      {/* 1. PROBLEM/S AND ACTION/S TAKEN (EXCEL PAGE 9) */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-5 text-white" />
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                PROBLEM/S AND ACTION/S TAKEN
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                IF ROWS ARE NOT ENOUGH, PLEASE ADD ANOTHER SHEET FOR YOUR ENTRIES. (Only for this quarter)
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white">
            4 Operational Dimensions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
              <tr>
                <th className="py-3 px-5 w-1/3">Dimension Particulars</th>
                <th className="py-3 px-5">Problem/s Encountered & Action/s Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {problemsDimensions.map((dim) => (
                <tr key={dim.key} className="hover:bg-[#E6EEF4]/30 transition">
                  <td className="p-4 align-top">
                    <p className="font-bold text-slate-900 text-xs">{dim.title}</p>
                  </td>
                  <td className="p-3">
                    <textarea
                      rows={3}
                      value={record.problemsAndActions[dim.key] || ''}
                      onChange={(e) => handleUpdateProblems(dim.key, e.target.value)}
                      readOnly={readOnly}
                      placeholder={`Enter specific problems and corrective actions taken for ${dim.title}...`}
                      className="w-full rounded-xl border border-[#B5BFCD] bg-white p-3 text-xs text-slate-900 focus:border-[#285497] focus:ring-1 focus:ring-[#285497] focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. PLANS FOR IMPROVEMENT (EXCEL PAGE 9) */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="size-5 text-white" />
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                PLANS FOR IMPROVEMENT
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Action/plan for the improvement of project's operation
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white">
            Future Targets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
              <tr>
                <th className="py-3 px-5 w-1/3">Target Dimension</th>
                <th className="py-3 px-5">Target Improvements & Execution Roadmap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {plansDimensions.map((dim) => (
                <tr key={dim.key} className="hover:bg-[#E6EEF4]/30 transition">
                  <td className="p-4 align-top">
                    <p className="font-bold text-slate-900 text-xs">{dim.title}</p>
                  </td>
                  <td className="p-3">
                    <textarea
                      rows={3}
                      value={record.plansForImprovement[dim.key] || ''}
                      onChange={(e) => handleUpdatePlans(dim.key, e.target.value)}
                      readOnly={readOnly}
                      placeholder={`Enter target execution plans for ${dim.title}...`}
                      className="w-full rounded-xl border border-[#B5BFCD] bg-white p-3 text-xs text-slate-900 focus:border-[#285497] focus:ring-1 focus:ring-[#285497] focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. OFFICIAL SIGN-OFF & CERTIFICATION (EXCEL PAGE 9) */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <FileCheck className="size-5 text-white" />
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                OFFICIAL MONITORING SIGN-OFF & VALIDATION
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                SIGNATURE OVER PRINTED NAME
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Interviewer: DOST-PSTO PERSONNEL */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-[#E6EEF4]/40 p-6 space-y-4 text-center">
              <div className="border-b border-[#B5BFCD]/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#285497]">
                  Interviewer:
                </span>
                <h4 className="text-sm font-black text-slate-900 uppercase mt-1">
                  DOST-PSTO PERSONNEL
                </h4>
              </div>

              <div className="space-y-3 text-xs text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Printed Name
                  </label>
                  <input
                    type="text"
                    value={record.signOff.interviewerName}
                    onChange={(e) => handleSignOffChange('interviewerName', e.target.value)}
                    readOnly={readOnly}
                    className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-3 font-bold text-slate-900 focus:border-[#285497] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={record.signOff.interviewerDesignation}
                    onChange={(e) => handleSignOffChange('interviewerDesignation', e.target.value)}
                    readOnly={readOnly}
                    className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-3 text-slate-700 focus:border-[#285497] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Date of Visit
                    </label>
                    <input
                      type="date"
                      value={record.signOff.dateOfVisit}
                      onChange={(e) => handleSignOffChange('dateOfVisit', e.target.value)}
                      readOnly={readOnly}
                      className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-bold text-slate-900 focus:border-[#285497] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Signature Date
                    </label>
                    <input
                      type="date"
                      value={record.signOff.interviewerSignatureDate}
                      onChange={(e) => handleSignOffChange('interviewerSignatureDate', e.target.value)}
                      readOnly={readOnly}
                      className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-bold text-slate-900 focus:border-[#285497] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#B5BFCD]/60 text-center">
                <div className="h-12 border-b-2 border-dashed border-[#B5BFCD] flex items-end justify-center pb-1">
                  <span className="font-serif italic text-slate-400 text-sm">
                    {record.signOff.interviewerName ? `Signed by ${record.signOff.interviewerName}` : 'Signature placeholder'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                  SIGNATURE OVER PRINTED NAME
                </p>
              </div>
            </div>

            {/* Respondent: ENTERPRISE REPRESENTATIVE */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-[#E6EEF4]/40 p-6 space-y-4 text-center">
              <div className="border-b border-[#B5BFCD]/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#285497]">
                  Respondent:
                </span>
                <h4 className="text-sm font-black text-slate-900 uppercase mt-1">
                  ENTERPRISE REPRESENTATIVE
                </h4>
              </div>

              <div className="space-y-3 text-xs text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Printed Name
                  </label>
                  <input
                    type="text"
                    value={record.signOff.respondentName}
                    onChange={(e) => handleSignOffChange('respondentName', e.target.value)}
                    readOnly={readOnly}
                    className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-3 font-bold text-slate-900 focus:border-[#285497] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={record.signOff.respondentDesignation}
                    onChange={(e) => handleSignOffChange('respondentDesignation', e.target.value)}
                    readOnly={readOnly}
                    className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-3 text-slate-700 focus:border-[#285497] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Signature Date
                  </label>
                  <input
                    type="date"
                    value={record.signOff.respondentSignatureDate}
                    onChange={(e) => handleSignOffChange('respondentSignatureDate', e.target.value)}
                    readOnly={readOnly}
                    className="mt-1 h-9 w-full rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-bold text-slate-900 focus:border-[#285497] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#B5BFCD]/60 text-center">
                <div className="h-12 border-b-2 border-dashed border-[#B5BFCD] flex items-end justify-center pb-1">
                  <span className="font-serif italic text-slate-400 text-sm">
                    {record.signOff.respondentName ? `Signed by ${record.signOff.respondentName}` : 'Signature placeholder'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                  SIGNATURE OVER PRINTED NAME
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

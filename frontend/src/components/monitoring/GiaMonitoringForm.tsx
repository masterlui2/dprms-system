import { useState, useRef, useLayoutEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'

import { formatCurrency, type ProjectRecord } from '../../data/admin'
import { cn } from '../../utils/cn'

interface AccomplishmentRow {
  id: string
  objective: string
  objectiveWeight: number
  activities: string
  targetAccomplishment: string
  targetWeightY1: number
  targetWeightY2: number
  targetWeightY3: number
  actualAccomplishment: string
  actualY1Percent: number
  actualY2Percent: number
  actualY3Percent: number
  remarks?: string
}

interface OutputRow {
  id: string
  category: string
  targetY1: number
  targetY2: number
  targetY3: number
  actualFigureY1: number
  actualDescY1: string
  actualFigureY2: number
  actualDescY2: string
  actualFigureY3: number
  actualDescY3: string
}

interface GiaMonitoringFormProps {
  project: ProjectRecord
  onBack: () => void
  hideTopBar?: boolean
}

function AutoResizeTextarea({
  value,
  onChange,
  className = '',
  placeholder = '',
  minRows = 2,
}: {
  value: string
  onChange: (val: string) => void
  className?: string
  placeholder?: string
  minRows?: number
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, minRows * 20)}px`
    }
  }, [value, minRows])

  return (
    <textarea
      className={cn(
        'w-full resize-none overflow-hidden transition-none [field-sizing:content] focus:outline-none',
        className,
      )}
      onChange={(e) => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, minRows * 20)}px`
        }
        onChange(e.target.value)
      }}
      placeholder={placeholder}
      ref={textareaRef}
      rows={minRows}
      value={value}
    />
  )
}

export function GiaMonitoringForm({ project, onBack, hideTopBar = false }: GiaMonitoringFormProps) {
  const mon = (project as any)?.setupMonitoring
  const isSetup = project?.program === 'SETUP'
  const gia = project?.gia

  const reportingPeriod = gia?.reportingPeriod || (isSetup ? 'CY 2026 (Quarterly)' : 'CY 2026 (Semi-Annual)')
  const [projectLeaderGender, setProjectLeaderGender] = useState(
    project.manager ? `${project.manager} (M)` : (mon ? `${mon.assignedStaff?.split('(')[0]?.trim()} (M)` : 'Dr. Kevin Lim (M)')
  )
  const [agency, setAgency] = useState(gia?.agency || project.enterprise)
  const [addressContact, setAddressContact] = useState(
    gia?.location ? `${gia.location} · 0917-123-4567 · info@dost.gov.ph` : (mon ? `${mon.pstoOffice}, Davao Oriental · 0917-888-2026 · enterprise@dost.gov.ph` : 'Mati City, Davao Oriental · 0917-123-4567 · gia@dost.gov.ph')
  )
  const [cooperatingAgencies, setCooperatingAgencies] = useState(gia?.cooperatingAgencies?.join(', ') || 'PSTO Davao Oriental, LGU Mati City')
  const [baseStation, setBaseStation] = useState(gia?.baseStation || (mon ? `${mon.pstoOffice}, Mati City` : 'DOST PSTO Davao Oriental'))
  const [sitesOfImplementation, setSitesOfImplementation] = useState(gia?.location || (mon ? `${mon.pstoOffice}, Region XI` : 'Davao Oriental, Region XI'))
  const [durationMonths, setDurationMonths] = useState(gia?.durationMonths || (isSetup ? 36 : 24))
  const [startDate, setStartDate] = useState(gia?.startDate || 'Jan 15, 2025')
  const [endDate, setEndDate] = useState(gia?.endDate || 'Jan 14, 2027')
  const [totalBudget, setTotalBudget] = useState(project.budget || (isSetup ? 3500000 : 2500000))

  const [accomplishments, setAccomplishments] = useState<AccomplishmentRow[]>(
    (gia as any)?.activities?.length ? (gia as any).activities.map((a: any, idx: number) => ({
      id: `acc_${idx + 1}`,
      objective: a.particulars || 'Operational Specific Objective',
      objectiveWeight: 20,
      activities: a.milestone || 'Field implementation & technology trials',
      targetAccomplishment: a.target || '100% completed deliverables',
      targetWeightY1: a.weight || 25,
      targetWeightY2: 0,
      targetWeightY3: 0,
      actualAccomplishment: a.status === 'Completed' ? '100% Accomplished' : (a.status === 'In Progress' ? '75% Accomplished' : 'Pending start'),
      actualY1Percent: a.status === 'Completed' ? 100 : (a.status === 'In Progress' ? 75 : 0),
      actualY2Percent: 0,
      actualY3Percent: 0,
      remarks: 'On schedule according to workplan.',
    })) : [
      {
        id: 'acc_1',
        objective: '1. Establish and validate community science & technology facility in target municipality.',
        objectiveWeight: 35,
        activities: 'Procurement of processing machinery, facility renovation, and trial test runs.',
        targetAccomplishment: 'Fully operational processing line compliant with regional standards.',
        targetWeightY1: 35,
        targetWeightY2: 0,
        targetWeightY3: 0,
        actualAccomplishment: 'Machinery delivered, installed, and validated by regional technical inspectorate.',
        actualY1Percent: 85,
        actualY2Percent: 0,
        actualY3Percent: 0,
        remarks: 'Calibrated and accepted by inspectorate.',
      },
      {
        id: 'acc_2',
        objective: '2. Capacity building and technical training of beneficiary operators and local personnel.',
        objectiveWeight: 25,
        activities: 'GMP, Food Safety, machine preventive maintenance, and digital inventory workshops.',
        targetAccomplishment: '40 community operators trained and certified.',
        targetWeightY1: 25,
        targetWeightY2: 0,
        targetWeightY3: 0,
        actualAccomplishment: '25 community operators certified across 2 training modules.',
        actualY1Percent: 70,
        actualY2Percent: 0,
        actualY3Percent: 0,
        remarks: 'Batch 2 training scheduled next quarter.',
      },
      {
        id: 'acc_3',
        objective: '3. Formulate municipal adoption policy and sustainable operations turnover plan.',
        objectiveWeight: 20,
        activities: 'Draft Sangguniang Bayan resolution and MOA with beneficiary cooperative.',
        targetAccomplishment: '1 SB Resolution enacted and approved turnover framework.',
        targetWeightY1: 20,
        targetWeightY2: 0,
        targetWeightY3: 0,
        actualAccomplishment: 'Drafted resolution submitted to Municipal Committee on Science and Technology.',
        actualY1Percent: 60,
        actualY2Percent: 0,
        actualY3Percent: 0,
        remarks: 'Under second reading at SB council.',
      },
      {
        id: 'acc_4',
        objective: '4. Semi-Annual Fund Liquidation, Audit, and Technical Reporting.',
        objectiveWeight: 20,
        activities: 'Preparation of financial statements, disbursement vouchers, and Form 10 filings.',
        targetAccomplishment: '100% timely liquidation submissions with zero COA audit findings.',
        targetWeightY1: 20,
        targetWeightY2: 0,
        targetWeightY3: 0,
        actualAccomplishment: 'Tranche 1 liquidated with PSTO accounting endorsement.',
        actualY1Percent: 90,
        actualY2Percent: 0,
        actualY3Percent: 0,
        remarks: 'Audit compliance certified clean.',
      },
    ]
  )

  const [catchUpPlan, setCatchUpPlan] = useState(
    '1. Acceleration of remaining training schedules for Batch 2 operators within Q4.\n2. Coordinated follow-up with the Sangguniang Bayan Secretariat for the 2nd reading of the adoption ordinance.\n3. Conduct on-site technical inspection for commercial pilot run in coordination with PSTO Davao Oriental.'
  )

  const [outputs, setOutputs] = useState<OutputRow[]>([
    {
      id: 'out_1',
      category: '1. Publications (P1)',
      targetY1: 2,
      targetY2: 1,
      targetY3: 0,
      actualFigureY1: 1,
      actualDescY1: '1 Technical progress article prepared and submitted to DOST Region XI Newsletter.',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    },
    {
      id: 'out_2',
      category: '2. Patents / Intellectual Property (P2)',
      targetY1: 1,
      targetY2: 0,
      targetY3: 0,
      actualFigureY1: 0,
      actualDescY1: 'Trademark application filed for community brand under IPO Philippines registration.',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    },
    {
      id: 'out_3',
      category: '3. Products / Commercialized Technologies (P3)',
      targetY1: 3,
      targetY2: 2,
      targetY3: 0,
      actualFigureY1: 2,
      actualDescY1: '2 Standardized community products packaged with DOST nutrition label design.',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    },
    {
      id: 'out_4',
      category: '4. People Services / Beneficiaries Trained (P4)',
      targetY1: 120,
      targetY2: 80,
      targetY3: 0,
      actualFigureY1: 85,
      actualDescY1: '85 community members and MSME staff trained in food safety, machine operations, and digital ledger.',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    },
    {
      id: 'out_5',
      category: '5. Places and Partnerships / LGUs Engaged (P5)',
      targetY1: 4,
      targetY2: 2,
      targetY3: 0,
      actualFigureY1: 3,
      actualDescY1: '3 Barangays covered under active deployment with MOA signed by Municipal Mayor.',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    },
    {
      id: 'out_6',
      category: '6. Policies Adopted (P6)',
      targetY1: 1,
      targetY2: 1,
      targetY3: 0,
      actualFigureY1: 1,
      actualDescY1: '1 Barangay Council Resolution adopting community facility guidelines enacted.',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    },
  ])

  const [problemConcern, setProblemConcern] = useState(
    '1. Intermittent power fluctuations at the community processing site causing slight delay in machinery calibration.\n2. Delays in raw material deliveries from upstream farming sitios due to heavy monsoon rains.'
  )
  const [suggestedSolution, setSuggestedSolution] = useState(
    '1. PSTO coordinated with Local Electric Cooperative (DORECO) for dedicated phase line and voltage regulator installation.\n2. Established buffer inventory storage schedule at the central processing hub.'
  )

  const [preparedBy, setPreparedBy] = useState(project.manager || 'Dr. Kevin Lim')
  const [reviewedBy, setReviewedBy] = useState('PSTD Officer, DOST PSTO Davao Oriental')
  const [approvedBy, setApprovedBy] = useState('Dr. Anthony C. Sales, CESO III / Regional Director')

  const handleAddAccomplishment = () => {
    const newAcc: AccomplishmentRow = {
      id: `acc_${Date.now()}`,
      objective: 'New Project Objective',
      objectiveWeight: 10,
      activities: 'Planned operational activities',
      targetAccomplishment: 'Target milestone output',
      targetWeightY1: 10,
      targetWeightY2: 0,
      targetWeightY3: 0,
      actualAccomplishment: 'Actual accomplishment description',
      actualY1Percent: 0,
      actualY2Percent: 0,
      actualY3Percent: 0,
      remarks: '',
    }
    setAccomplishments([...accomplishments, newAcc])
  }

  const handleDeleteAccomplishment = (id: string) => {
    setAccomplishments(accomplishments.filter((a) => a.id !== id))
  }

  const handleAddOutput = () => {
    const newOut: OutputRow = {
      id: `out_${Date.now()}`,
      category: 'New 6Ps Deliverable',
      targetY1: 1,
      targetY2: 0,
      targetY3: 0,
      actualFigureY1: 0,
      actualDescY1: '',
      actualFigureY2: 0,
      actualDescY2: '',
      actualFigureY3: 0,
      actualDescY3: '',
    }
    setOutputs([...outputs, newOut])
  }

  const handleDeleteOutput = (id: string) => {
    setOutputs(outputs.filter((o) => o.id !== id))
  }

  const computedTargetTotal = accomplishments.reduce((sum, r) => sum + (r.targetWeightY1 || 0), 0)
  const computedWeightedTotal = accomplishments.reduce((sum, r) => {
    return sum + ((r.targetWeightY1 || 0) * (r.actualY1Percent || 0)) / 100
  }, 0)

  const total6pTargetY1 = outputs.reduce((s, o) => s + (o.targetY1 || 0), 0)
  const total6pActualY1 = outputs.reduce((s, o) => s + (o.actualFigureY1 || 0), 0)
  const pct6pY1 = total6pTargetY1 > 0 ? Math.round((total6pActualY1 / total6pTargetY1) * 100) : 0

  const handleSave = () => {
    // Save handler
  }

  return (
    <div className="w-full space-y-6 font-sans text-slate-900">
      {!hideTopBar && (
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] bg-[#E6EEF4]/50 text-[#285497] transition hover:bg-[#E6EEF4] hover:text-[#285497]"
                onClick={onBack}
                title="Back to monitored projects"
                type="button"
              >
                <ArrowLeft className="size-5" />
              </button>

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
                  DOST-GIA Form 10 · <span className="text-[#285497] font-bold">Executive Summary of Technical Progress Report</span> · {reportingPeriod}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497]"
                onClick={handleSave}
                type="button"
              >
                <Save className="size-3.5 text-[#285497]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-6 sm:p-8 space-y-8 text-xs text-slate-900">
          <div className="border border-[#B5BFCD] divide-y divide-[#B5BFCD] rounded-xl overflow-hidden bg-white">
            <div className="p-4 space-y-3.5 bg-[#E6EEF4]/20">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-3 font-bold text-slate-700 text-xs">(1) Program Title:</span>
                <span className="md:col-span-9 font-bold text-[#285497] text-xs">
                  {isSetup ? 'Small Enterprise Technology Upgrading Program (DOST-SETUP)' : 'Grants-in-Aid (DOST-GIA) Program'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-3 font-bold text-slate-700 text-xs">Project Title:</span>
                <span className="md:col-span-9 font-bold text-slate-900 text-xs">
                  {project.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-3 font-bold text-slate-700 text-xs">Project Leader / Gender:</span>
                <input
                  className="md:col-span-3 h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setProjectLeaderGender(e.target.value)}
                  placeholder="e.g. Engr. Juan Dela Cruz (M)"
                  value={projectLeaderGender}
                />
                <span className="md:col-span-2 font-bold text-slate-700 md:text-right text-xs">Agency:</span>
                <input
                  className="md:col-span-4 h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setAgency(e.target.value)}
                  value={agency}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-3 font-bold text-slate-700 text-xs">Address / Contact / Email:</span>
                <AutoResizeTextarea
                  className="md:col-span-9 rounded-lg border border-[#B5BFCD] bg-white p-2 font-normal text-slate-800 focus:border-[#0f53b7] text-xs"
                  minRows={1}
                  onChange={setAddressContact}
                  placeholder="Address / Contact details / Email..."
                  value={addressContact}
                />
              </div>
            </div>

            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-3 font-bold text-slate-700 text-xs">(2) Cooperating Agency/ies:</span>
                <input
                  className="md:col-span-9 h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setCooperatingAgencies(e.target.value)}
                  value={cooperatingAgencies}
                />
              </div>
            </div>

            <div className="p-4 space-y-3 bg-[#E6EEF4]/20">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <span className="md:col-span-3 font-bold text-slate-700 text-xs">(3) Site/s of Implementation:</span>
                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                    onChange={(e) => setBaseStation(e.target.value)}
                    placeholder="Base Station..."
                    value={baseStation}
                  />
                  <input
                    className="h-8 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                    onChange={(e) => setSitesOfImplementation(e.target.value)}
                    placeholder="Field implementation sites..."
                    value={sitesOfImplementation}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#B5BFCD] bg-white">
              <div className="p-4 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700 text-xs">(4) Project Duration (Months):</span>
                <input
                  className="h-8 w-20 rounded-lg border border-[#B5BFCD] bg-white px-2 text-center font-bold text-slate-900 focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setDurationMonths(Number(e.target.value) || 0)}
                  type="number"
                  value={durationMonths}
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700 text-xs">(5) Project Start Date:</span>
                <input
                  className="h-8 w-32 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setStartDate(e.target.value)}
                  value={startDate}
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-700 text-xs">(6) Project End Date:</span>
                <input
                  className="h-8 w-32 rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-normal text-slate-800 focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setEndDate(e.target.value)}
                  value={endDate}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#B5BFCD] bg-[#E6EEF4]/20">
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">(7) Total Project Budget</span>
                <input
                  className="mt-1 h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2.5 font-mono font-bold text-[#285497] focus:border-[#0f53b7] text-xs focus:outline-none"
                  onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
                  type="number"
                  value={totalBudget}
                />
              </div>
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Year 1 (40%)</span>
                <p className="mt-1.5 font-mono font-bold text-slate-900 text-xs">{formatCurrency(totalBudget * 0.4)}</p>
              </div>
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Year 2 (40%)</span>
                <p className="mt-1.5 font-mono font-bold text-slate-900 text-xs">{formatCurrency(totalBudget * 0.4)}</p>
              </div>
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Year 3 (20%)</span>
                <p className="mt-1.5 font-mono font-bold text-slate-900 text-xs">{formatCurrency(totalBudget * 0.2)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#B5BFCD] pb-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  A. ACTUAL ACCOMPLISHMENT OF THE PROJECT (VIS-A-VIS OBJECTIVES)
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Sections (8) to (16) · Specific Project Objectives, Activities, and Technical Accomplishments
                </p>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#B5BFCD] bg-white px-3 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                onClick={handleAddAccomplishment}
                type="button"
              >
                <Plus className="size-3.5 text-[#285497]" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="border border-[#B5BFCD] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                  <tr>
                    <th className="py-3 px-3 w-[18%]">Objectives (8)</th>
                    <th className="py-3 px-3 w-[18%]">Activities</th>
                    <th className="py-3 px-3 w-[18%]">Target Accomplishments (9)</th>
                    <th className="py-3 px-2 text-center w-14">Weight % (10)</th>
                    <th className="py-3 px-3 w-[18%]">Actual Accomplishments (11)</th>
                    <th className="py-3 px-2 text-center w-14">Actual % (12)</th>
                    <th className="py-3 px-2 text-center w-16">Weighted % (13)</th>
                    <th className="py-3 px-2 text-center w-16">Cumulative %</th>
                    <th className="py-3 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B5BFCD]/40 text-slate-800 bg-white">
                  {accomplishments.map((row) => {
                    const weightedY1 = (row.targetWeightY1 * row.actualY1Percent) / 100
                    return (
                      <tr className="hover:bg-[#E6EEF4]/20 transition-colors" key={row.id}>
                        <td className="p-2.5">
                          <AutoResizeTextarea
                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                            minRows={2}
                            onChange={(val) => {
                              setAccomplishments(accomplishments.map((a) => a.id === row.id ? { ...a, objective: val } : a))
                            }}
                            placeholder="Objective..."
                            value={row.objective}
                          />
                        </td>
                        <td className="p-2.5">
                          <AutoResizeTextarea
                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                            minRows={2}
                            onChange={(val) => {
                              setAccomplishments(accomplishments.map((a) => a.id === row.id ? { ...a, activities: val } : a))
                            }}
                            placeholder="Activities..."
                            value={row.activities}
                          />
                        </td>
                        <td className="p-2.5">
                          <AutoResizeTextarea
                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                            minRows={2}
                            onChange={(val) => {
                              setAccomplishments(accomplishments.map((a) => a.id === row.id ? { ...a, targetAccomplishment: val } : a))
                            }}
                            placeholder="Target indicators..."
                            value={row.targetAccomplishment}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            className="h-8 w-12 rounded-lg border border-[#B5BFCD] bg-white p-1 text-center font-mono font-bold text-slate-900 focus:border-[#0f53b7] text-xs focus:outline-none"
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0
                              setAccomplishments(accomplishments.map((a) => a.id === row.id ? { ...a, targetWeightY1: val } : a))
                            }}
                            type="number"
                            value={row.targetWeightY1}
                          />
                        </td>
                        <td className="p-2.5">
                          <AutoResizeTextarea
                            className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs font-normal text-slate-800 focus:border-[#0f53b7] leading-relaxed"
                            minRows={2}
                            onChange={(val) => {
                              setAccomplishments(accomplishments.map((a) => a.id === row.id ? { ...a, actualAccomplishment: val } : a))
                            }}
                            placeholder="Actual accomplishments..."
                            value={row.actualAccomplishment}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            className="h-8 w-12 rounded-lg border border-[#B5BFCD] bg-white p-1 text-center font-mono font-bold text-[#285497] focus:border-[#0f53b7] text-xs focus:outline-none"
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0
                              setAccomplishments(accomplishments.map((a) => a.id === row.id ? { ...a, actualY1Percent: val } : a))
                            }}
                            type="number"
                            value={row.actualY1Percent}
                          />
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-[#285497]">
                          {weightedY1.toFixed(1)}%
                        </td>
                        <td className="p-2 text-center font-mono font-black text-slate-900">
                          {weightedY1.toFixed(1)}%
                        </td>
                        <td className="p-2 text-center">
                          <button
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            onClick={() => handleDeleteAccomplishment(row.id)}
                            title="Delete Objective Row"
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E6EEF4]/60 font-bold text-slate-900 border-t border-[#B5BFCD]">
                    <td className="py-3 px-3 text-right" colSpan={3}>
                      (14) Yearly Target / (15) Actual Accomplishment Totals:
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs font-black text-[#285497]">
                      {computedTargetTotal}%
                    </td>
                    <td className="py-3 px-3" />
                    <td className="py-3 px-2 text-center font-mono text-xs font-black text-[#285497]">
                      {computedWeightedTotal.toFixed(1)}%
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs font-black text-slate-900" colSpan={2}>
                      {computedWeightedTotal.toFixed(1)}%
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="border-b border-[#B5BFCD] pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                B. CATCH-UP PLAN (17)
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Operational catch-up activities and adjustments for milestones
              </p>
            </div>
            <div className="border border-[#B5BFCD] rounded-xl p-4 bg-white">
              <AutoResizeTextarea
                className="rounded-lg border border-[#B5BFCD] bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#0f53b7] font-normal"
                minRows={3}
                onChange={setCatchUpPlan}
                placeholder="Enter details of catch-up activities..."
                value={catchUpPlan}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#B5BFCD] pb-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  C. EXPECTED OUTPUTS / 6PS (18 - 23)
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  6Ps Deliverables (Publications, Patents/IP, Products, People Services, Places & Partnerships, Policies)
                </p>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#B5BFCD] bg-white px-3 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                onClick={handleAddOutput}
                type="button"
              >
                <Plus className="size-3.5 text-[#285497]" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="border border-[#B5BFCD] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                  <tr>
                    <th className="py-3 px-3 w-[26%]">Expected Outputs / Category (18)</th>
                    <th className="py-3 px-2 text-center w-20">Target (19)</th>
                    <th className="py-3 px-2 text-center w-20">Actual (20)</th>
                    <th className="py-3 px-3 w-[45%]">Accomplishment Description (22)</th>
                    <th className="py-3 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B5BFCD]/40 text-slate-800 bg-white">
                  {outputs.map((out) => (
                    <tr className="hover:bg-[#E6EEF4]/20 transition-colors" key={out.id}>
                      <td className="p-2.5">
                        <AutoResizeTextarea
                          className="rounded-lg border border-[#B5BFCD] bg-white p-2 font-normal text-slate-800 focus:border-[#0f53b7] text-xs"
                          minRows={1}
                          onChange={(val) => {
                            setOutputs(outputs.map((o) => o.id === out.id ? { ...o, category: val } : o))
                          }}
                          placeholder="6Ps Deliverable Category..."
                          value={out.category}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          className="h-8 w-14 rounded-lg border border-[#B5BFCD] bg-white p-1 text-center font-mono font-bold text-slate-900 focus:border-[#0f53b7] text-xs focus:outline-none"
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setOutputs(outputs.map((o) => o.id === out.id ? { ...o, targetY1: val } : o))
                          }}
                          type="number"
                          value={out.targetY1}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          className="h-8 w-14 rounded-lg border border-[#B5BFCD] bg-white p-1 text-center font-mono font-bold text-[#285497] focus:border-[#0f53b7] text-xs focus:outline-none"
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setOutputs(outputs.map((o) => o.id === out.id ? { ...o, actualFigureY1: val } : o))
                          }}
                          type="number"
                          value={out.actualFigureY1}
                        />
                      </td>
                      <td className="p-2.5">
                        <AutoResizeTextarea
                          className="rounded-lg border border-[#B5BFCD] bg-white p-2 text-xs text-slate-800 font-normal focus:border-[#0f53b7] leading-relaxed"
                          minRows={1}
                          onChange={(val) => {
                            setOutputs(outputs.map((o) => o.id === out.id ? { ...o, actualDescY1: val } : o))
                          }}
                          placeholder="Description of accomplishments..."
                          value={out.actualDescY1}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          onClick={() => handleDeleteOutput(out.id)}
                          title="Delete Output Row"
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E6EEF4]/60 font-bold text-slate-900 border-t border-[#B5BFCD]">
                    <td className="py-3 px-3 text-right">
                      (21) Overall 6Ps Deliverables Progress:
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs font-black text-slate-900">
                      {total6pTargetY1}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs font-black text-[#285497]">
                      {total6pActualY1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700" colSpan={2}>
                      Accomplishment Rate: <strong className="text-[#285497] font-mono font-bold">{pct6pY1}%</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-[#B5BFCD] rounded-xl overflow-hidden bg-white">
              <div className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#285497]">
                (24) PROBLEMS / CONCERNS
              </div>
              <div className="p-4">
                <AutoResizeTextarea
                  className="rounded-lg border border-[#B5BFCD] bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#0f53b7] font-normal"
                  minRows={3}
                  onChange={setProblemConcern}
                  placeholder="State obstacles met..."
                  value={problemConcern}
                />
              </div>
            </div>

            <div className="border border-[#B5BFCD] rounded-xl overflow-hidden bg-white">
              <div className="bg-[#E6EEF4]/60 border-b border-[#B5BFCD] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#285497]">
                (25) SUGGESTED SOLUTIONS
              </div>
              <div className="p-4">
                <AutoResizeTextarea
                  className="rounded-lg border border-[#B5BFCD] bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#0f53b7] font-normal"
                  minRows={3}
                  onChange={setSuggestedSolution}
                  placeholder="State recommended solutions..."
                  value={suggestedSolution}
                />
              </div>
            </div>
          </div>

          <div className="border border-[#B5BFCD] rounded-xl p-6 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-2 p-4 rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30">
                <span className="text-slate-500 font-bold uppercase text-[11px] block">Prepared by (26):</span>
                <input
                  className="h-8 w-full text-center font-semibold uppercase border border-[#B5BFCD] rounded-lg py-1 text-xs text-slate-900 bg-white focus:border-[#0f53b7] focus:outline-none"
                  onChange={(e) => setPreparedBy(e.target.value)}
                  value={preparedBy}
                />
                <p className="text-[11px] text-[#285497] font-bold mt-1">Project Leader, IA</p>
              </div>

              <div className="space-y-2 p-4 rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30">
                <span className="text-slate-500 font-bold uppercase text-[11px] block">Reviewed by (27):</span>
                <input
                  className="h-8 w-full text-center font-semibold uppercase border border-[#B5BFCD] rounded-lg py-1 text-xs text-slate-900 bg-white focus:border-[#0f53b7] focus:outline-none"
                  onChange={(e) => setReviewedBy(e.target.value)}
                  value={reviewedBy}
                />
                <p className="text-[11px] text-[#285497] font-bold mt-1">ARD or PSTD, DOST XI</p>
              </div>

              <div className="space-y-2 p-4 rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30">
                <span className="text-slate-500 font-bold uppercase text-[11px] block">Approved by (28):</span>
                <input
                  className="h-8 w-full text-center font-semibold uppercase border border-[#B5BFCD] rounded-lg py-1 text-xs text-slate-900 bg-white focus:border-[#0f53b7] focus:outline-none"
                  onChange={(e) => setApprovedBy(e.target.value)}
                  value={approvedBy}
                />
                <p className="text-[11px] text-[#285497] font-bold mt-1">Regional Director, DOST XI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#B5BFCD] pt-6 print:hidden">
            <p className="text-xs font-semibold text-slate-500">
              DOST-GIA Form 10 · Executive Summary of Technical Progress Report
            </p>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#B5BFCD] bg-white px-5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95"
            >
              <Save className="size-4 text-[#285497]" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

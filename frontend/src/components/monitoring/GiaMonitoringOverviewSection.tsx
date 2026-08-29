import {
  ChevronRight,
  Clock,
  FileText,
  FolderKanban,
  Landmark,
  TrendingUp,
  Users2,
} from 'lucide-react'
import type { ProjectRecord } from '../../data/admin'

interface Props {
  projects: ProjectRecord[]
  onSelectProject: (project: ProjectRecord) => void
  period?: string
  onOpenCalendar?: () => void
}

type PeriodKey = 'Q1 2024' | 'Q2 2024' | 'Q3 2024' | 'Q4 2024' | 'Full Year 2024'

interface SectorBreakdown {
  farmersFisherfolk: number
  womenGroups: number
  cooperatives: number
  indigenousPeoples: number
}

interface GiaPeriodData {
  label: string
  activeProjects: number
  totalPortfolio: number
  growthRate: string
  grantAllocation: string
  accomplishmentRate: string
  accomplishmentGrowth: string
  beneficiariesCount: number
  beneficiariesGrowth: string
  sectors: SectorBreakdown
  youthCount: number
  scCount: number
  pwdCount: number
  trainedOperators: number
  targetAccomplishment: string
  actualAccomplishment: string
  varianceAccomplishment: string
  objectivePct: number
  outputsPct: number
  interventionsPct: number
  sixPsPerformance: [number, number, number, number, number, number]
  activities: Array<{
    id: string
    projectTitle: string
    action: string
    date: string
    status: 'Verified' | 'Saved'
  }>
  milestoneDeadlines: Array<{
    id: string
    month: string
    day: string
    project: string
    deliverable: string
    type: 'Form 10' | 'Liquidation' | 'Policy' | 'Terminal'
    isDueSoon?: boolean
  }>
}

const GIA_PERIOD_DATA: Record<PeriodKey, GiaPeriodData> = {
  'Q1 2024': {
    label: 'Q1 2024 (Jan - Mar)',
    activeProjects: 4,
    totalPortfolio: 5,
    growthRate: '+5.2%',
    grantAllocation: '₱16.80M',
    accomplishmentRate: '68.2%',
    accomplishmentGrowth: '+5.4%',
    beneficiariesCount: 380,
    beneficiariesGrowth: '+7.8%',
    sectors: {
      farmersFisherfolk: 165,
      womenGroups: 115,
      cooperatives: 60,
      indigenousPeoples: 40,
    },
    youthCount: 55,
    scCount: 25,
    pwdCount: 15,
    trainedOperators: 95,
    targetAccomplishment: '100%',
    actualAccomplishment: '68.2%',
    varianceAccomplishment: '31.8%',
    objectivePct: 70,
    outputsPct: 65,
    interventionsPct: 72,
    sixPsPerformance: [50, 40, 60, 75, 65, 55],
    activities: [
      { id: 'gia-q1-1', projectTitle: 'Barangay Central Fisherfolk Association', action: 'DOST Form 10 quarterly progress verified', date: '29 Mar 2024', status: 'Verified' },
      { id: 'gia-q1-2', projectTitle: 'Tagum Agricultural Reform Beneficiaries', action: '6Ps technical accomplishment updated', date: '21 Mar 2024', status: 'Saved' },
      { id: 'gia-q1-3', projectTitle: 'Cateel Bamboo Association', action: 'Catch-up plan review completed', date: '15 Mar 2024', status: 'Verified' },
    ],
    milestoneDeadlines: [
      { id: 'dl-q1-1', month: 'APR', day: '15', project: 'Barangay Central Fisherfolk Association', deliverable: 'DOST Form 10 Q1 Progress Submission', type: 'Form 10', isDueSoon: true },
      { id: 'dl-q1-2', month: 'APR', day: '30', project: 'Tagum Agricultural Reform Beneficiaries', deliverable: 'Q1 Financial Liquidation Report', type: 'Liquidation' },
      { id: 'dl-q1-3', month: 'MAY', day: '10', project: 'Community Water System Baganga', deliverable: 'LGU Adoption Resolution Review', type: 'Policy' },
    ],
  },
  'Q2 2024': {
    label: 'Q2 2024 (Apr - Jun)',
    activeProjects: 4,
    totalPortfolio: 5,
    growthRate: '+6.8%',
    grantAllocation: '₱17.90M',
    accomplishmentRate: '74.5%',
    accomplishmentGrowth: '+6.3%',
    beneficiariesCount: 430,
    beneficiariesGrowth: '+13.1%',
    sectors: {
      farmersFisherfolk: 190,
      womenGroups: 130,
      cooperatives: 62,
      indigenousPeoples: 48,
    },
    youthCount: 65,
    scCount: 28,
    pwdCount: 12,
    trainedOperators: 115,
    targetAccomplishment: '100%',
    actualAccomplishment: '74.5%',
    varianceAccomplishment: '25.5%',
    objectivePct: 76,
    outputsPct: 72,
    interventionsPct: 78,
    sixPsPerformance: [60, 50, 70, 80, 75, 65],
    activities: [
      { id: 'gia-q2-1', projectTitle: 'Tagum Agricultural Reform Beneficiaries', action: 'DOST Form 10 semi-annual report submitted', date: '28 Jun 2024', status: 'Verified' },
      { id: 'gia-q2-2', projectTitle: 'Barangay Central Fisherfolk Association', action: 'Field site inspection verified by PSTD', date: '20 Jun 2024', status: 'Verified' },
      { id: 'gia-q2-3', projectTitle: 'Community Water System Baganga', action: 'Technical progress baseline saved', date: '11 Jun 2024', status: 'Saved' },
    ],
    milestoneDeadlines: [
      { id: 'dl-q2-1', month: 'JUL', day: '15', project: 'Tagum Agricultural Reform Beneficiaries', deliverable: 'Semi-Annual Technical Progress Report (Form 10)', type: 'Form 10', isDueSoon: true },
      { id: 'dl-q2-2', month: 'JUL', day: '31', project: 'Cateel Bamboo Association', deliverable: 'Mid-Year Fund Liquidation Audit', type: 'Liquidation' },
      { id: 'dl-q2-3', month: 'AUG', day: '15', project: 'Community Water System Baganga', deliverable: 'Community Operator Certification Milestone', type: 'Policy' },
    ],
  },
  'Q3 2024': {
    label: 'Q3 2024 (Jul - Sep)',
    activeProjects: 5,
    totalPortfolio: 5,
    growthRate: '+8.4%',
    grantAllocation: '₱18.45M',
    accomplishmentRate: '78.4%',
    accomplishmentGrowth: '+3.9%',
    beneficiariesCount: 480,
    beneficiariesGrowth: '+11.6%',
    sectors: {
      farmersFisherfolk: 210,
      womenGroups: 145,
      cooperatives: 70,
      indigenousPeoples: 55,
    },
    youthCount: 75,
    scCount: 32,
    pwdCount: 18,
    trainedOperators: 140,
    targetAccomplishment: '100%',
    actualAccomplishment: '78.4%',
    varianceAccomplishment: '21.6%',
    objectivePct: 80,
    outputsPct: 78,
    interventionsPct: 82,
    sixPsPerformance: [70, 60, 85, 88, 80, 75],
    activities: [
      { id: 'gia-q3-1', projectTitle: 'Community Water System Baganga', action: 'DOST Form 10 quarterly progress approved', date: '24 Sep 2024', status: 'Verified' },
      { id: 'gia-q3-2', projectTitle: 'Tagum Agricultural Reform Beneficiaries', action: 'LGU adoption resolution recorded', date: '18 Sep 2024', status: 'Verified' },
      { id: 'gia-q3-3', projectTitle: 'Barangay Central Fisherfolk Association', action: 'Monitoring Form 10 updated by Focal', date: '10 Sep 2024', status: 'Saved' },
    ],
    milestoneDeadlines: [
      { id: 'dl-q3-1', month: 'OCT', day: '15', project: 'Tagum Agricultural Reform Beneficiaries', deliverable: 'DOST Form 10 Q3 Technical Progress Submission', type: 'Form 10', isDueSoon: true },
      { id: 'dl-q3-2', month: 'OCT', day: '28', project: 'Community Water System Baganga', deliverable: 'LGU Technology Turn-Over & Resolution', type: 'Policy' },
      { id: 'dl-q3-3', month: 'NOV', day: '15', project: 'Cateel Bamboo Association', deliverable: 'Grant Tranche 2 Liquidation Statement', type: 'Liquidation' },
    ],
  },
  'Q4 2024': {
    label: 'Q4 2024 (Oct - Dec)',
    activeProjects: 5,
    totalPortfolio: 5,
    growthRate: '+9.5%',
    grantAllocation: '₱18.45M',
    accomplishmentRate: '86.0%',
    accomplishmentGrowth: '+7.6%',
    beneficiariesCount: 520,
    beneficiariesGrowth: '+8.3%',
    sectors: {
      farmersFisherfolk: 230,
      womenGroups: 155,
      cooperatives: 75,
      indigenousPeoples: 60,
    },
    youthCount: 85,
    scCount: 35,
    pwdCount: 15,
    trainedOperators: 160,
    targetAccomplishment: '100%',
    actualAccomplishment: '86.0%',
    varianceAccomplishment: '14.0%',
    objectivePct: 88,
    outputsPct: 85,
    interventionsPct: 90,
    sixPsPerformance: [80, 75, 95, 92, 90, 85],
    activities: [
      { id: 'gia-q4-1', projectTitle: 'Tagum Agricultural Reform Beneficiaries', action: 'Terminal project report prepared', date: '18 Dec 2024', status: 'Verified' },
      { id: 'gia-q4-2', projectTitle: 'Barangay Central Fisherfolk Association', action: 'DOST Form 10 annual review completed', date: '12 Dec 2024', status: 'Verified' },
      { id: 'gia-q4-3', projectTitle: 'Cateel Bamboo Association', action: 'Year-end 6Ps summary signed by Director', date: '05 Dec 2024', status: 'Verified' },
    ],
    milestoneDeadlines: [
      { id: 'dl-q4-1', month: 'JAN', day: '15', project: 'Tagum Agricultural Reform Beneficiaries', deliverable: 'Terminal Technical Progress Report & Form 10', type: 'Terminal', isDueSoon: true },
      { id: 'dl-q4-2', month: 'JAN', day: '31', project: 'Barangay Central Fisherfolk Association', deliverable: 'Final Fund Liquidation & COA Audit Sign-off', type: 'Liquidation' },
      { id: 'dl-q4-3', month: 'FEB', day: '10', project: 'Cateel Bamboo Association', deliverable: 'Year-End 6Ps Portfolio Consolidation', type: 'Form 10' },
    ],
  },
  'Full Year 2024': {
    label: 'Full Year 2024 (Consolidated)',
    activeProjects: 5,
    totalPortfolio: 5,
    growthRate: '+14.2%',
    grantAllocation: '₱18.45M',
    accomplishmentRate: '86.0%',
    accomplishmentGrowth: '+17.8%',
    beneficiariesCount: 520,
    beneficiariesGrowth: '+36.8%',
    sectors: {
      farmersFisherfolk: 230,
      womenGroups: 155,
      cooperatives: 75,
      indigenousPeoples: 60,
    },
    youthCount: 85,
    scCount: 35,
    pwdCount: 15,
    trainedOperators: 160,
    targetAccomplishment: '100%',
    actualAccomplishment: '86.0%',
    varianceAccomplishment: '14.0%',
    objectivePct: 88,
    outputsPct: 85,
    interventionsPct: 90,
    sixPsPerformance: [80, 75, 95, 92, 90, 85],
    activities: [
      { id: 'gia-fy-1', projectTitle: 'Tagum Agricultural Reform Beneficiaries', action: 'Annual compliance audit verified', date: '20 Dec 2024', status: 'Verified' },
      { id: 'gia-fy-2', projectTitle: 'Barangay Central Fisherfolk Association', action: 'Full DOST Form 10 portfolio exported', date: '19 Dec 2024', status: 'Verified' },
      { id: 'gia-fy-3', projectTitle: 'Community Water System Baganga', action: 'Consolidated technical accomplishments approved', date: '15 Dec 2024', status: 'Verified' },
    ],
    milestoneDeadlines: [
      { id: 'dl-fy-1', month: 'JAN', day: '15', project: 'Tagum Agricultural Reform Beneficiaries', deliverable: 'Annual DOST-GIA Form 10 Technical Progress', type: 'Form 10', isDueSoon: true },
      { id: 'dl-fy-2', month: 'JAN', day: '31', project: 'Barangay Central Fisherfolk Association', deliverable: 'Annual Fund Liquidation Summary', type: 'Liquidation' },
      { id: 'dl-fy-3', month: 'FEB', day: '15', project: 'Community Water System Baganga', deliverable: 'Regional Technical Review Evaluation', type: 'Terminal' },
    ],
  },
}

export function GiaMonitoringOverviewSection({
  projects,
  onSelectProject,
  period = 'Q3 2024',
}: Props) {
  const currentKey = (period as PeriodKey) in GIA_PERIOD_DATA ? (period as PeriodKey) : 'Q3 2024'
  const current = GIA_PERIOD_DATA[currentKey]

  const totalSectors = current.beneficiariesCount || 1
  const farmersPct = Math.round((current.sectors.farmersFisherfolk / totalSectors) * 100)
  const womenPct = Math.round((current.sectors.womenGroups / totalSectors) * 100)
  const coopPct = Math.round((current.sectors.cooperatives / totalSectors) * 100)
  const ipPct = 100 - (farmersPct + womenPct + coopPct)

  const sixPsLabels = [
    { code: 'P1', label: 'Publications' },
    { code: 'P2', label: 'Patents / IP' },
    { code: 'P3', label: 'Products' },
    { code: 'P4', label: 'People Services' },
    { code: 'P5', label: 'Places / LGUs' },
    { code: 'P6', label: 'Policies' },
  ]

  return (
    <div className="space-y-4 font-sans">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <FolderKanban className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              {current.growthRate}
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Active monitored projects</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{projects.length || current.activeProjects}</p>
          <p className="text-[11px] text-slate-400 font-normal">of {current.totalPortfolio} portfolio projects</p>
        </div>

        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <Landmark className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              Funded
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Grant portfolio allocation</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.grantAllocation}</p>
          <p className="text-[11px] text-slate-400 font-normal">Total DOST-GIA grants deployed</p>
        </div>

        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <TrendingUp className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              {current.accomplishmentGrowth}
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Form 10 accomplishment rate</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.accomplishmentRate}</p>
          <p className="text-[11px] text-slate-400 font-normal">Weighted technical progress</p>
        </div>

        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <Users2 className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              {current.beneficiariesGrowth}
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Community beneficiaries reached</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.beneficiariesCount}</p>
          <p className="text-[11px] text-slate-400 font-normal">Directly assisted across 4 sectors</p>
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Technical progress viability</h3>
              <span className="text-[11px] font-bold text-[#285497] bg-[#E6EEF4] px-2 py-0.5 rounded-full">
                On track
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-b border-[#B5BFCD]/40 pb-3 text-center">
              <div>
                <p className="text-base font-black text-slate-900">{current.targetAccomplishment}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Target</p>
              </div>
              <div>
                <p className="text-base font-black text-[#285497]">{current.actualAccomplishment}</p>
                <p className="text-[10px] text-[#285497] uppercase font-bold">Actual rate</p>
              </div>
              <div>
                <p className="text-base font-black text-slate-500">{current.varianceAccomplishment}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Variance</p>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Specific Project Objectives</span>
                  <span className="font-bold text-slate-900">{current.objectivePct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#285497] rounded-full" style={{ width: `${current.objectivePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>6Ps Expected Deliverables</span>
                  <span className="font-bold text-slate-900">{current.outputsPct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#285497]/70 rounded-full" style={{ width: `${current.outputsPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Community Technology Adoption</span>
                  <span className="font-bold text-[#285497]">{current.interventionsPct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#285497] rounded-full" style={{ width: `${current.interventionsPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">6Ps milestone performance</h3>
            <p className="text-[11px] text-slate-400 font-normal">Semi-Annual technical deliverables for {period}</p>

            <div className="mt-3 flex items-end justify-around h-24 px-1">
              {sixPsLabels.map((item, idx) => (
                <div key={item.code} className="flex flex-col items-center gap-1">
                  <div className="w-5 h-20 rounded-t overflow-hidden flex flex-col justify-end bg-slate-100">
                    <div
                      className="bg-[#285497] rounded-t transition-all duration-500"
                      style={{ height: `${current.sixPsPerformance[idx]}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{item.code}</span>
                </div>
              ))}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] border-t border-[#B5BFCD]/40 pt-2 font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500 truncate">
                  <span className="size-1.5 rounded-full bg-[#285497]" /> P1 Publications
                </span>
                <span className="font-bold text-slate-900">{current.sixPsPerformance[0]}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500 truncate">
                  <span className="size-1.5 rounded-full bg-[#285497]" /> P2 Patents / IP
                </span>
                <span className="font-bold text-slate-900">{current.sixPsPerformance[1]}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500 truncate">
                  <span className="size-1.5 rounded-full bg-[#285497]" /> P3 Products
                </span>
                <span className="font-bold text-slate-900">{current.sixPsPerformance[2]}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500 truncate">
                  <span className="size-1.5 rounded-full bg-[#285497]" /> P4 People Services
                </span>
                <span className="font-bold text-slate-900">{current.sixPsPerformance[3]}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Beneficiary sector inclusion</h3>
            <p className="text-[11px] text-slate-400 font-normal">Target community groups under DOST-GIA</p>

            <div className="mt-2.5 flex items-center justify-between gap-4">
              <div className="relative flex size-24 shrink-0 items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#E6EEF4]"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#285497]"
                    strokeDasharray={`${farmersPct}, 100`}
                    strokeDashoffset="0"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#0f53b7]"
                    strokeDasharray={`${womenPct}, 100`}
                    strokeDashoffset={`-${farmersPct}`}
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#4169E1]"
                    strokeDasharray={`${coopPct}, 100`}
                    strokeDashoffset={`-${farmersPct + womenPct}`}
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#B5BFCD]"
                    strokeDasharray={`${ipPct}, 100`}
                    strokeDashoffset={`-${farmersPct + womenPct + coopPct}`}
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="block text-lg font-black text-slate-900 leading-tight">{current.beneficiariesCount}</span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold">TOTAL</span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="size-2 rounded-full bg-[#285497]" /> Farmers/Fisherfolk
                  </span>
                  <span className="font-bold text-slate-900">{current.sectors.farmersFisherfolk} ({farmersPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="size-2 rounded-full bg-[#0f53b7]" /> Women's Groups
                  </span>
                  <span className="font-bold text-slate-900">{current.sectors.womenGroups} ({womenPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="size-2 rounded-full bg-[#4169E1]" /> Cooperatives / MSME
                  </span>
                  <span className="font-bold text-slate-900">{current.sectors.cooperatives} ({coopPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="size-2 rounded-full bg-[#B5BFCD]" /> Indigenous (IPs)
                  </span>
                  <span className="font-bold text-slate-900">{current.sectors.indigenousPeoples} ({ipPct}%)</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-[#B5BFCD]/40">
              <span className="rounded-lg bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
                Youth: <strong className="text-slate-900 font-black">{current.youthCount}</strong>
              </span>
              <span className="rounded-lg bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
                SC: <strong className="text-slate-900 font-black">{current.scCount}</strong>
              </span>
              <span className="rounded-lg bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
                PWD: <strong className="text-slate-900 font-black">{current.pwdCount}</strong>
              </span>
              <span className="rounded-lg bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
                Trained: <strong className="text-slate-900 font-black">{current.trainedOperators}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent monitoring activity</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Latest saved and verified Form 10 sheets for {period}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-[#285497] hover:underline transition flex items-center gap-0.5"
            >
              <span>View all</span>
              <span className="text-xs">↗</span>
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {current.activities.map((act) => {
              const matched = projects.find((p) => (p.enterprise || p.title) === act.projectTitle) || projects[0]
              return (
                <div
                  key={act.id}
                  onClick={() => matched && onSelectProject(matched)}
                  className="flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497] shrink-0">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#285497] transition">
                          {act.projectTitle}
                        </span>
                        <span className="rounded bg-[#E6EEF4] px-1.5 py-0.5 text-[10px] font-bold text-[#285497]">
                          {act.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        {act.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0">
                    {act.date}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Reporting & milestone schedule</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Upcoming Form 10 submissions & liquidation deadlines
              </p>
            </div>
            <span className="rounded-lg border border-[#B5BFCD] px-2 py-1 text-[11px] font-bold text-[#285497] bg-[#E6EEF4]">
              DOST-GIA Schedule
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            {current.milestoneDeadlines.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-1 rounded-xl hover:bg-[#E6EEF4]/40 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex flex-col items-center justify-center size-11 rounded-xl shrink-0 ${
                      m.isDueSoon
                        ? 'bg-[#0f53b7] text-white shadow-sm'
                        : 'bg-[#E6EEF4] text-[#285497]'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase leading-tight">{m.month}</span>
                    <span className="text-sm font-black leading-tight">{m.day}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{m.project}</p>
                      <span className="rounded bg-[#E6EEF4] px-1.5 py-0.2 text-[10px] font-bold text-[#285497]">
                        {m.type}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="size-3 text-[#285497]" />
                      <span>{m.deliverable}</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

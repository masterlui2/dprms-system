import {
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  FolderKanban,
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

interface PeriodData {
  label: string
  activeProjects: number
  totalPortfolio: number
  growthRate: string
  assetBookValue: string
  workforce: number
  workforceGrowth: string
  maleCount: number
  femaleCount: number
  youthCount: number
  scCount: number
  pwdCount: number
  avgMargin: string
  grossSales: string
  productionCost: string
  netProfit: string
  costPct: number
  profitPct: number
  costStructureMonths: Array<{
    month: string
    heights: [number, number, number, number]
  }>
  costBreakdown: {
    rawMat: number
    labor: number
    overhead: number
    misc: number
  }
  activities: Array<{
    id: string
    enterprise: string
    action: string
    date: string
    status: 'Verified' | 'Saved'
  }>
}

const PERIOD_DATA: Record<PeriodKey, PeriodData> = {
  'Q1 2024': {
    label: 'Q1 2024 (Jan - Mar)',
    activeProjects: 22,
    totalPortfolio: 31,
    growthRate: '+6.5%',
    assetBookValue: '₱11.90M',
    workforce: 172,
    workforceGrowth: '+8.2%',
    maleCount: 108,
    femaleCount: 64,
    youthCount: 12,
    scCount: 8,
    pwdCount: 5,
    avgMargin: '18.9%',
    grossSales: '₱7.15M',
    productionCost: '₱5.80M',
    netProfit: '₱1.35M',
    costPct: 81.1,
    profitPct: 18.9,
    costStructureMonths: [
      { month: 'Jan', heights: [40, 28, 20, 12] },
      { month: 'Feb', heights: [41, 27, 19, 13] },
      { month: 'Mar', heights: [43, 26, 19, 12] },
    ],
    costBreakdown: { rawMat: 41, labor: 27, overhead: 19, misc: 13 },
    activities: [
      { id: 'act-q1-1', enterprise: 'Madayaway Food Products', action: 'Quarterly sheet verified', date: '28 Mar 2024', status: 'Verified' },
      { id: 'act-q1-2', enterprise: 'Mati Seaweed Processors', action: 'Monitoring sheet saved', date: '22 Mar 2024', status: 'Saved' },
      { id: 'act-q1-3', enterprise: 'Davao Agri Processing', action: 'Quarterly sheet verified', date: '18 Mar 2024', status: 'Verified' },
    ],
  },
  'Q2 2024': {
    label: 'Q2 2024 (Apr - Jun)',
    activeProjects: 23,
    totalPortfolio: 31,
    growthRate: '+7.4%',
    assetBookValue: '₱12.35M',
    workforce: 180,
    workforceGrowth: '+10.1%',
    maleCount: 112,
    femaleCount: 68,
    youthCount: 13,
    scCount: 9,
    pwdCount: 6,
    avgMargin: '19.7%',
    grossSales: '₱7.85M',
    productionCost: '₱6.30M',
    netProfit: '₱1.55M',
    costPct: 80.3,
    profitPct: 19.7,
    costStructureMonths: [
      { month: 'Apr', heights: [41, 28, 19, 12] },
      { month: 'May', heights: [43, 27, 18, 12] },
      { month: 'Jun', heights: [42, 27, 20, 11] },
    ],
    costBreakdown: { rawMat: 42, labor: 27, overhead: 19, misc: 12 },
    activities: [
      { id: 'act-q2-1', enterprise: 'Madayaway Food Products', action: 'Quarterly sheet verified', date: '29 Jun 2024', status: 'Verified' },
      { id: 'act-q2-2', enterprise: "Ric's Vinegar Enterprise", action: 'Monitoring sheet saved', date: '24 Jun 2024', status: 'Saved' },
      { id: 'act-q2-3', enterprise: 'Davao Agri Processing', action: 'Quarterly sheet verified', date: '19 Jun 2024', status: 'Verified' },
    ],
  },
  'Q3 2024': {
    label: 'Q3 2024 (Jul - Sep)',
    activeProjects: 24,
    totalPortfolio: 31,
    growthRate: '+8.3%',
    assetBookValue: '₱12.84M',
    workforce: 186,
    workforceGrowth: '+12.4%',
    maleCount: 115,
    femaleCount: 71,
    youthCount: 14,
    scCount: 9,
    pwdCount: 6,
    avgMargin: '18.6%',
    grossSales: '₱8.42M',
    productionCost: '₱6.85M',
    netProfit: '₱1.57M',
    costPct: 81.4,
    profitPct: 18.6,
    costStructureMonths: [
      { month: 'Jul', heights: [42, 27, 19, 12] },
      { month: 'Aug', heights: [40, 29, 18, 13] },
      { month: 'Sep', heights: [44, 25, 20, 11] },
    ],
    costBreakdown: { rawMat: 42, labor: 27, overhead: 19, misc: 12 },
    activities: [
      { id: 'act-q3-1', enterprise: 'Madayaway Food Products', action: 'Quarterly sheet verified', date: '18 Sep 2024', status: 'Verified' },
      { id: 'act-q3-2', enterprise: "Ric's Vinegar Enterprise", action: 'Monitoring sheet saved', date: '12 Sep 2024', status: 'Saved' },
      { id: 'act-q3-3', enterprise: 'Davao Agri Processing', action: 'Quarterly sheet verified', date: '05 Sep 2024', status: 'Verified' },
    ],
  },
  'Q4 2024': {
    label: 'Q4 2024 (Oct - Dec)',
    activeProjects: 25,
    totalPortfolio: 31,
    growthRate: '+9.1%',
    assetBookValue: '₱13.20M',
    workforce: 194,
    workforceGrowth: '+14.2%',
    maleCount: 120,
    femaleCount: 74,
    youthCount: 16,
    scCount: 10,
    pwdCount: 7,
    avgMargin: '19.5%',
    grossSales: '₱9.20M',
    productionCost: '₱7.40M',
    netProfit: '₱1.80M',
    costPct: 80.5,
    profitPct: 19.5,
    costStructureMonths: [
      { month: 'Oct', heights: [43, 26, 19, 12] },
      { month: 'Nov', heights: [45, 25, 18, 12] },
      { month: 'Dec', heights: [44, 26, 19, 11] },
    ],
    costBreakdown: { rawMat: 44, labor: 26, overhead: 19, misc: 11 },
    activities: [
      { id: 'act-q4-1', enterprise: 'Madayaway Food Products', action: 'Quarterly sheet verified', date: '18 Dec 2024', status: 'Verified' },
      { id: 'act-q4-2', enterprise: 'Mati Seaweed Processors', action: 'Quarterly sheet verified', date: '14 Dec 2024', status: 'Verified' },
      { id: 'act-q4-3', enterprise: "Ric's Vinegar Enterprise", action: 'Monitoring sheet saved', date: '08 Dec 2024', status: 'Saved' },
    ],
  },
  'Full Year 2024': {
    label: 'Full Year 2024 (Annual YTD)',
    activeProjects: 25,
    totalPortfolio: 31,
    growthRate: '+11.8%',
    assetBookValue: '₱13.20M',
    workforce: 194,
    workforceGrowth: '+14.2%',
    maleCount: 120,
    femaleCount: 74,
    youthCount: 16,
    scCount: 10,
    pwdCount: 7,
    avgMargin: '19.2%',
    grossSales: '₱32.62M',
    productionCost: '₱26.35M',
    netProfit: '₱6.27M',
    costPct: 80.8,
    profitPct: 19.2,
    costStructureMonths: [
      { month: 'Q1', heights: [41, 27, 19, 13] },
      { month: 'Q2', heights: [42, 27, 19, 12] },
      { month: 'Q3', heights: [42, 27, 19, 12] },
    ],
    costBreakdown: { rawMat: 42, labor: 27, overhead: 19, misc: 12 },
    activities: [
      { id: 'act-ytd-1', enterprise: 'Madayaway Food Products', action: 'Annual report consolidated', date: '20 Dec 2024', status: 'Verified' },
      { id: 'act-ytd-2', enterprise: 'Mati Seaweed Processors', action: 'Annual compliance review', date: '15 Dec 2024', status: 'Verified' },
      { id: 'act-ytd-3', enterprise: 'Davao Agri Processing', action: 'Annual financial audit', date: '10 Dec 2024', status: 'Verified' },
    ],
  },
}

export function MonitoringOverviewSection({
  projects,
  onSelectProject,
  period = 'Q3 2024',
  onOpenCalendar,
}: Props) {
  const current = PERIOD_DATA[(period as PeriodKey)] || PERIOD_DATA['Q3 2024']

  const malePct = current.workforce > 0 ? Math.round((current.maleCount / current.workforce) * 100) : 0
  const femalePct = current.workforce > 0 ? 100 - malePct : 0

  const upcomingVisits = [
    {
      id: 'vis-1',
      month: 'OCT',
      day: '08',
      enterprise: 'Madayaway Food Products',
      location: 'Lower Kapayas, Mati City · 9:00 AM',
      highlight: true,
    },
    {
      id: 'vis-2',
      month: 'OCT',
      day: '15',
      enterprise: 'Davao Agri Processing',
      location: 'Tagum City · 10:30 AM',
      highlight: false,
    },
    {
      id: 'vis-3',
      month: 'OCT',
      day: '22',
      enterprise: "Ric's Vinegar Enterprise",
      location: 'Mati City · 1:00 PM',
      highlight: false,
    },
  ]

  return (
    <div className="space-y-4 font-sans">
      {/* 1. TOP 4 KPI CARDS */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 */}
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
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.activeProjects}</p>
          <p className="text-[11px] text-slate-400 font-normal">of {current.totalPortfolio} portfolio projects</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <Building2 className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              Book value
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Total fixed asset book value</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.assetBookValue}</p>
          <p className="text-[11px] text-slate-400 font-normal">Buildings & equipment</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <Users2 className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              {current.workforceGrowth}
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Total workforce impact</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.workforce}</p>
          <p className="text-[11px] text-slate-400 font-normal">Direct & indirect employees</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <TrendingUp className="size-4.5" />
            </div>
            <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[11px] font-bold text-[#285497]">
              Healthy
            </span>
          </div>
          <p className="mt-2.5 text-xs font-normal text-slate-500">Portfolio average net profit margin</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">{current.avgMargin}</p>
          <p className="text-[11px] text-slate-400 font-normal">Across reporting enterprises</p>
        </div>
      </div>

      {/* 2. CORE FINANCIALS & WORKFORCE (3 Columns Grid) */}
      <div className="grid gap-3.5 lg:grid-cols-3">
        {/* Financial Viability */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Financial viability</h3>
              <span className="text-[11px] font-bold text-[#285497] bg-[#E6EEF4] px-2 py-0.5 rounded-full">
                On track
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-b border-[#B5BFCD]/40 pb-3 text-center">
              <div>
                <p className="text-base font-black text-slate-900">{current.grossSales}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Gross sales</p>
              </div>
              <div>
                <p className="text-base font-black text-slate-900">{current.productionCost}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Production cost</p>
              </div>
              <div>
                <p className="text-base font-black text-[#285497]">{current.netProfit}</p>
                <p className="text-[10px] text-[#285497] uppercase font-bold">Net profit</p>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Gross sales</span>
                  <span className="font-bold text-slate-900">100%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#285497] rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Production cost</span>
                  <span className="font-bold text-slate-900">{current.costPct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#285497]/70 rounded-full" style={{ width: `${current.costPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Net profit</span>
                  <span className="font-bold text-[#285497]">{current.profitPct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#285497] rounded-full" style={{ width: `${current.profitPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Month Cost Structure */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">3-month cost structure</h3>
            <p className="text-[11px] text-slate-400 font-normal">Accumulated production costs for {period}</p>

            {/* 3 Bars */}
            <div className="mt-3 flex items-end justify-around h-24 px-2">
              {current.costStructureMonths.map((m) => (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-20 rounded overflow-hidden flex flex-col bg-slate-100">
                    <div className="bg-[#285497]" style={{ height: `${m.heights[0]}%` }} />
                    <div className="bg-[#4169E1]" style={{ height: `${m.heights[1]}%` }} />
                    <div className="bg-[#7B9FE0]" style={{ height: `${m.heights[2]}%` }} />
                    <div className="bg-[#B5BFCD]" style={{ height: `${m.heights[3]}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{m.month}</span>
                </div>
              ))}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] border-t border-[#B5BFCD]/40 pt-2 font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="size-1.5 rounded-full bg-[#285497]" /> Raw materials
                </span>
                <span className="font-bold text-slate-900">{current.costBreakdown.rawMat}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="size-1.5 rounded-full bg-[#4169E1]" /> Labor
                </span>
                <span className="font-bold text-slate-900">{current.costBreakdown.labor}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="size-1.5 rounded-full bg-[#7B9FE0]" /> Overhead & utilities
                </span>
                <span className="font-bold text-slate-900">{current.costBreakdown.overhead}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="size-1.5 rounded-full bg-[#B5BFCD]" /> Misc. costs
                </span>
                <span className="font-bold text-slate-900">{current.costBreakdown.misc}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workforce Demographics */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Workforce demographics</h3>
            <p className="text-[11px] text-slate-400 font-normal">Direct & indirect workforce</p>

            <div className="mt-2.5 flex items-center justify-between gap-4">
              {/* Donut */}
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
                    strokeDasharray={`${malePct}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="block text-lg font-black text-slate-900 leading-tight">{current.workforce}</span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold">TOTAL</span>
                </div>
              </div>

              {/* Roster counts */}
              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="size-2 rounded-full bg-[#285497]" /> Male
                  </span>
                  <span className="font-bold text-slate-900">{current.maleCount} ({malePct}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="size-2 rounded-full bg-[#B5BFCD]" /> Female
                  </span>
                  <span className="font-bold text-slate-900">{current.femaleCount} ({femalePct}%)</span>
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
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXACT 2 CARDS: RECENT MONITORING ACTIVITY & SITE VISIT CALENDAR */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Card 1: Recent monitoring activity */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent monitoring activity</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Latest saved and verified sheets for {period}
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
              const matched = projects.find((p) => p.enterprise === act.enterprise) || projects[0]
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
                          {act.enterprise}
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

        {/* Card 2: Site visit calendar */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Site visit calendar</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Upcoming field validation visits
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="rounded-lg border border-[#B5BFCD] p-1.5 text-[#285497] hover:bg-[#E6EEF4] transition cursor-pointer"
              title="Open Calendar View"
            >
              <Calendar className="size-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3.5">
            {upcomingVisits.map((v) => (
              <div
                key={v.id}
                onClick={onOpenCalendar}
                className="flex items-center justify-between gap-3 p-1 rounded-xl hover:bg-[#E6EEF4]/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex flex-col items-center justify-center size-11 rounded-xl shrink-0 ${
                      v.highlight
                        ? 'bg-[#0f53b7] text-white shadow-sm'
                        : 'bg-[#E6EEF4] text-[#285497]'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase leading-tight">{v.month}</span>
                    <span className="text-sm font-black leading-tight">{v.day}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{v.enterprise}</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{v.location}</p>
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

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
import { MetricCard } from '../../components/admin/MetricCard'
import { StatusPill } from '../../components/admin/StatusPill'
import {
  featureImportance,
  predictions,
  type PredictionRecord,
} from '../../data/admin'

const predictionColumns: DataColumn<PredictionRecord>[] = [
  {
    id: 'enterprise',
    header: 'Enterprise',
    sortValue: (prediction) => prediction.enterprise,
    render: (prediction) => (
      <div>
        <p className="font-bold text-slate-900">{prediction.enterprise}</p>
        <p className="mt-1 text-xs text-slate-500">{prediction.projectId}</p>
      </div>
    ),
  },
  {
    id: 'growth',
    header: 'Growth',
    sortValue: (prediction) => prediction.growth,
    render: (prediction) => (
      <StatusPill
        tone={
          prediction.growth === 'Expanding'
            ? 'success'
            : prediction.growth === 'Declining'
              ? 'danger'
              : 'neutral'
        }
      >
        {prediction.growth}
      </StatusPill>
    ),
  },
  {
    id: 'sustainability',
    header: 'Sustainability',
    sortValue: (prediction) => prediction.sustainability,
    render: (prediction) => (
      <span className="font-semibold text-slate-700">
        {prediction.sustainability}
      </span>
    ),
  },
  {
    id: 'risk',
    header: 'Risk Score',
    sortValue: (prediction) => prediction.riskScore,
    render: (prediction) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
          <div
            className={
              prediction.riskScore >= 70
                ? 'h-full bg-red-500'
                : prediction.riskScore >= 45
                  ? 'h-full bg-amber-500'
                  : 'h-full bg-emerald-500'
            }
            style={{ width: `${prediction.riskScore}%` }}
          />
        </div>
        <span className="text-xs font-black text-slate-700">
          {prediction.riskScore}
        </span>
      </div>
    ),
  },
  {
    id: 'recommendation',
    header: 'Recommendation',
    sortValue: (prediction) => prediction.recommendation,
    render: (prediction) => (
      <StatusPill
        tone={
          prediction.recommendation === 'Renewal recommended'
            ? 'success'
            : prediction.recommendation === 'At risk'
              ? 'danger'
              : 'warning'
        }
      >
        {prediction.recommendation}
      </StatusPill>
    ),
  },
]

export function PredictivePage() {
  const atRisk = predictions.filter(
    (prediction) => prediction.recommendation === 'At risk',
  ).length
  const recommended = predictions.filter(
    (prediction) => prediction.recommendation === 'Renewal recommended',
  ).length

  return (
    <div className="space-y-7">
      <AdminPageHeader
        action={
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8e1ee] bg-white px-4 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-[#0f53b7]"
            type="button"
          >
            <RefreshCw className="size-4" />
            Refresh Scores
          </button>
        }
        description="Review Random Forest classifications for MSME growth, project sustainability, risk, and renewal eligibility."
        eyebrow="Decision Support"
        title="Predictive Analytics"
      />

      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-[#073b82] to-[#0f53b7] p-5 text-white shadow-lg shadow-blue-950/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Brain className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black">Random Forest assessment model</p>
            <p className="mt-1 text-sm leading-6 text-blue-100">
              Mock decision-support results based on financial, operational, and
              compliance indicators. Scores support review and do not replace an
              authorized DOST decision.
            </p>
          </div>
          <StatusPill tone="success">Model ready</StatusPill>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Current mock evaluation set"
          icon={Brain}
          label="MSMEs Assessed"
          value={String(predictions.length)}
        />
        <MetricCard
          detail="Low sustainability risk"
          icon={ShieldCheck}
          label="Sustainable"
          tone="green"
          value="1"
        />
        <MetricCard
          detail="Eligible for renewal review"
          icon={CheckCircle2}
          label="Renewal Recommended"
          tone="sky"
          value={String(recommended)}
        />
        <MetricCard
          detail="Requires priority intervention"
          icon={AlertTriangle}
          label="At Risk"
          tone="red"
          value={String(atRisk)}
        />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <AdminPanel title="Sustainability assessments">
          <DataTable
            columns={predictionColumns}
            data={predictions}
            emptyTitle="No assessments available"
            getRowKey={(prediction) => prediction.projectId}
            searchPlaceholder="Search enterprise, project, growth, or recommendation..."
            searchText={(prediction) =>
              `${prediction.enterprise} ${prediction.projectId} ${prediction.growth} ${prediction.sustainability} ${prediction.recommendation}`
            }
          />
        </AdminPanel>

        <AdminPanel
          description="Relative influence in the mock model"
          title="Feature importance"
        >
          <div className="space-y-5 p-5">
            {featureImportance.map((feature) => (
              <div key={feature.label}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700">
                    {feature.label}
                  </span>
                  <span className="font-black text-[#073b82]">
                    {feature.value}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#0f53b7]"
                    style={{ width: `${feature.value}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              <TrendingUp className="mt-0.5 size-4 shrink-0" />
              Budget utilization and report timeliness currently have the
              strongest influence on sustainability outcomes.
            </p>
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}

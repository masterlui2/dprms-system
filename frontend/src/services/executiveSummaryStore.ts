// src/services/executiveSummaryStore.ts
import api from '../lib/axios'
import type { AccomplishmentRow, OutputRow, ActionRow } from '../types/giaMonitoring' // move the two interfaces out of GiaMonitoringForm.tsx if they aren't exported yet

interface BackendAccomplishment {
  id: number; objectives: string; activities: string; target_milestones: string
  weight: number; actual_accomplishment: string; actual: number
}
interface BackendOutput {
  id: number; expected_output: string; target: number; actual: number
  weight: number; description: string
}
interface BackendAction {
  id: number
  cooperating_agency: string
  plan: string
  solutions: string
  concern: string
}

// add to BackendExecutiveSummary
interface BackendExecutiveSummary {
  id: number; semester: number; year: number; total_project_budget: number
  accomplishments?: BackendAccomplishment[]
  outputs?: BackendOutput[]
  actions?: BackendAction[]
}

function toActionRow(a: BackendAction): ActionRow {
  return {
    id: `act_${a.id}`,
    cooperatingAgency: a.cooperating_agency,
    plan: a.plan,
    solutions: a.solutions,
    concern: a.concern,
  }
}

function toAccomplishmentRow(a: BackendAccomplishment): AccomplishmentRow {
  return {
    id: `acc_${a.id}`,
    objective: a.objectives,
    objectiveWeight: a.weight,
    activities: a.activities,
    targetAccomplishment: a.target_milestones,
    targetWeightY1: a.weight,
    targetWeightY2: 0,
    targetWeightY3: 0,
    actualAccomplishment: a.actual_accomplishment,
    actualY1Percent: Number(a.actual) || 0,
    actualY2Percent: 0,
    actualY3Percent: 0,
    remarks: '',
  }
}

function toOutputRow(o: BackendOutput): OutputRow {
  return {
    id: `out_${o.id}`,
    category: o.expected_output,
    targetY1: o.target,
    targetY2: 0,
    targetY3: 0,
    actualFigureY1: o.actual,
    actualDescY1: o.description,
    actualFigureY2: 0,
    actualDescY2: '',
    actualFigureY3: 0,
    actualDescY3: '',
  }
}

export async function fetchOrCreateExecutiveSummary(
  projectId: number,
  semester: 1 | 2,
  year: number,
  totalProjectBudget: number,
) {
  const { data: existing } = await api.get<{ data: BackendExecutiveSummary[] }>(
    `/projects/${projectId}/executive-summary`,
    { params: { semester, year } },
  )

  let summary = existing.data[0]

  if (!summary) {
    const { data: created } = await api.post<{ data: BackendExecutiveSummary }>(
      `/projects/${projectId}/executive-summary`,
      { semester, year, total_project_budget: totalProjectBudget },
    )
    summary = created.data
  }
  // NOTE: no update route exists for ExecutiveSummary yet, so editing
  // totalBudget after the summary is first created won't persist —
  // a second POST here would 409. Add an update() endpoint if that's needed.

  return {
    summaryId: summary.id,
    accomplishments: (summary.accomplishments ?? []).map(toAccomplishmentRow),
    outputs: (summary.outputs ?? []).map(toOutputRow),
    actions: (summary.actions ?? []).map(toActionRow),
    }
}
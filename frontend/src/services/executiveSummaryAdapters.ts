// src/services/executiveSummaryAdapters.ts
import type { ResourceAdapter } from './batchSync'

export const accomplishmentAdapter: ResourceAdapter = {
  endpoint: 'accomplishment',
  recordKey: 'accomplishments',
  toPayload: (r: any) => ({
    objectives: r.objective,
    activities: r.activities,
    target_milestones: r.targetAccomplishment,
    weight: r.targetWeightY1 ?? 0,
    actual_accomplishment: r.actualAccomplishment,
    actual: r.actualY1Percent ?? 0,
  }),
}

export const outputAdapter: ResourceAdapter = {
  endpoint: 'output',
  recordKey: 'outputs',
  toPayload: (o: any) => ({
    expected_output: o.category,
    target: o.targetY1 ?? 0,
    actual: o.actualFigureY1 ?? 0,
    weight: o.weight ?? 0, // no UI input yet — always 0 until a weight column exists
    description: o.actualDescY1 ?? '',
  }),
}

export const actionAdapter: ResourceAdapter = {
  endpoint: 'action',
  recordKey: 'actions',
  toPayload: (a: any) => ({
    cooperating_agency: a.cooperatingAgency,
    plan: a.plan,
    solutions: a.solutions,
    concern: a.concern,
  }),
}

export const EXEC_SUMMARY_ADAPTERS = [accomplishmentAdapter, outputAdapter, actionAdapter]




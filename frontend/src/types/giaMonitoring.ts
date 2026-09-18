// src/types/giaMonitoring.ts
export interface AccomplishmentRow {
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

export interface OutputRow {
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

export interface ActionRow {
  id: string
  cooperatingAgency: string
  plan: string
  solutions: string
  concern: string
}
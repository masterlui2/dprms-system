import type { ApplicationProgram } from '../types/application'

const PROGRAM_ACCESS_KEY = 'dprms.program-access'

function readProgramAccess(): ApplicationProgram[] {
  if (typeof window === 'undefined') return []

  const rawAccess = window.localStorage.getItem(PROGRAM_ACCESS_KEY)

  if (!rawAccess) return []

  try {
    return JSON.parse(rawAccess) as ApplicationProgram[]
  } catch {
    window.localStorage.removeItem(PROGRAM_ACCESS_KEY)
    return []
  }
}

export function hasProgramAccess(program: ApplicationProgram) {
  return readProgramAccess().includes(program)
}

export function grantProgramAccess(program: ApplicationProgram) {
  if (typeof window === 'undefined') return

  const access = readProgramAccess()

  if (!access.includes(program)) {
    window.localStorage.setItem(PROGRAM_ACCESS_KEY, JSON.stringify([program, ...access]))
  }
}

export function getProgramRegistrationUrl(program: ApplicationProgram) {
  const slug = program.toLowerCase()
  const redirect = encodeURIComponent(`/programs/${slug}`)

  return `/register?program=${slug}&redirect=${redirect}`
}

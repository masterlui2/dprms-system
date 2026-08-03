import { Navigate, useLocation, useParams } from 'react-router-dom'

import { getMockUser } from '../lib/mockAuth'
import { grantProgramAccess, hasProgramAccess } from '../lib/programAccess'
import type { ApplicationProgram } from '../types/application'

export function ProposalSubmission() {
  const { program = '' } = useParams()
  const location = useLocation()
  const user = getMockUser()

  let selectedProgram: ApplicationProgram = 'SETUP'
  if (program.toUpperCase() === 'GIA' || location.pathname.includes('/gia')) {
    selectedProgram = 'GIA'
  } else if (program.toUpperCase() === 'SETUP' || location.pathname.includes('/setup')) {
    selectedProgram = 'SETUP'
  } else if (user?.program) {
    selectedProgram = user.program
  }

  if (user) {
    grantProgramAccess(selectedProgram)
  }

  const hasAccess = user || hasProgramAccess(selectedProgram)

  if (!hasAccess) {
    const slug = selectedProgram.toLowerCase()
    const target = `/programs/${slug}/register`
    const redirect = encodeURIComponent(target)
    return <Navigate replace to={`/register?program=${slug}&redirect=${redirect}`} />
  }

  if (selectedProgram === 'GIA') {
    return <Navigate replace to="/gia/my-proposal" />
  }

  return <Navigate replace to="/setup/my-application" />
}

import { Navigate, useParams } from 'react-router-dom'

export function ProposalSubmission() {
  const { program = '' } = useParams()
  const proposalType = program.toUpperCase()

  if (proposalType !== 'GIA' && proposalType !== 'SETUP') {
    return <Navigate replace to="/programs/setup" />
  }

  if (proposalType === 'SETUP') return <Navigate replace to="/programs/setup/register" />
  if (proposalType === 'GIA') return <Navigate replace to="/programs/gia/register" />

  return null
}

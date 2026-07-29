import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { canAccessModule, type ModuleId } from '../../config/permissions'
import { getMockUser } from '../../lib/mockAuth'

export function ProtectedRoute({ children, module }: { children: ReactNode, module: ModuleId }) {
  const user = getMockUser()

  if (!user) return <Navigate replace to="/login" />
  if (!canAccessModule(user.role, module)) return <Navigate replace to="/unauthorized" />

  return children
}

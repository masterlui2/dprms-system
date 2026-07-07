import { createBrowserRouter } from 'react-router-dom'

import { RoleGate } from '../components/auth/RoleGate'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { ProposalSubmission } from '../pages/ProposalSubmission'
import { ApprovalsPage } from '../pages/admin/ApprovalsPage'
import { BudgetPage } from '../pages/admin/BudgetPage'
import { InventoryPage } from '../pages/admin/InventoryPage'
import { MonitoringPage } from '../pages/admin/MonitoringPage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { AuditTrailPage } from '../pages/admin/AuditTrailPage'
import { DashboardHome } from '../pages/dashboard/DashboardHome'
import { ProponentWorkspacePage } from '../pages/proponent/ProponentWorkspacePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/proposal',
    element: <ProposalSubmission />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: 'approvals',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <ApprovalsPage />
          </RoleGate>
        ),
      },
      {
        path: 'budget',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <BudgetPage />
          </RoleGate>
        ),
      },
      {
        path: 'monitoring',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <MonitoringPage />
          </RoleGate>
        ),
      },
      {
        path: 'inventory',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <InventoryPage />
          </RoleGate>
        ),
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'proposals',
        element: (
          <RoleGate allowedRoles={['proponent']}>
            <ProponentWorkspacePage />
          </RoleGate>
        ),
      },
      {
        path: 'audit',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <AuditTrailPage />
          </RoleGate>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

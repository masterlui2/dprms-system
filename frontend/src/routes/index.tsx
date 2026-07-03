import { createBrowserRouter } from 'react-router-dom'

import { DashboardLayout } from '../layouts/DashboardLayout'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { ProposalSubmission } from '../pages/ProposalSubmission'
import { AdminDashboard } from '../pages/admin/AdminDashboard'
import { ApprovalsPage } from '../pages/admin/ApprovalsPage'
import { BudgetPage } from '../pages/admin/BudgetPage'
import { InventoryPage } from '../pages/admin/InventoryPage'
import { MonitoringPage } from '../pages/admin/MonitoringPage'
import { PredictivePage } from '../pages/admin/PredictivePage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { AuditTrailPage } from '../pages/admin/AuditTrailPage'

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
        element: <AdminDashboard />,
      },
      {
        path: 'approvals',
        element: <ApprovalsPage />,
      },
      {
        path: 'budget',
        element: <BudgetPage />,
      },
      {
        path: 'monitoring',
        element: <MonitoringPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'predictive',
        element: <PredictivePage />,
      },
      {
        path: 'audit',
        element: <AuditTrailPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

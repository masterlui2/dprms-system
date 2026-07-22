import { Navigate, createBrowserRouter } from 'react-router-dom'

import { RoleGate } from '../components/auth/RoleGate'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { ActivateAccount } from '../pages/ActivateAccount'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { ProgramLanding } from '../pages/ProgramLanding'
import { ProposalSubmission } from '../pages/ProposalSubmission'
import { Register } from '../pages/Register'
import { SetupProposalRegistration } from '../pages/SetupProposalRegistration'
import { GiaProposalRegistration } from '../pages/GiaProposalRegistration'
import { ApprovalsPage } from '../pages/admin/ApprovalsPage'
import { BudgetPage } from '../pages/admin/BudgetPage'
import { InventoryPage } from '../pages/admin/InventoryPage'
import { MonitoringPage } from '../pages/admin/MonitoringPage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { AuditTrailPage } from '../pages/admin/AuditTrailPage'
import { DashboardHome } from '../pages/dashboard/DashboardHome'
import { ProponentDashboard } from '../pages/proponent/ProponentDashboard'
import { MyProposalsPage } from '../pages/proponent/MyProposalsPage'
import { DocumentaryRequirementsPage } from '../pages/proponent/DocumentaryRequirementsPage'
import { ApplicationStatusPage } from '../pages/proponent/ApplicationStatusPage'
import { ProfilePage } from '../pages/proponent/ProfilePage'

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
    path: '/register',
    element: <Register />,
  },
  {
    path: '/proposal',
    element: <ProposalSubmission />,
  },
  {
    path: '/programs/setup/register',
    element: <SetupProposalRegistration />,
  },
  {
    path: '/programs/gia/register',
    element: <GiaProposalRegistration />,
  },
  {
    path: '/programs/:program',
    element: <ProgramLanding />,
  },
  {
    path: '/apply/:program',
    element: <ProposalSubmission />,
  },
  {
    path: '/activate/:referenceNo',
    element: <ActivateAccount />,
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
        path: 'applications',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <ApprovalsPage />
          </RoleGate>
        ),
      },
      {
        path: 'document-validation',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <ApprovalsPage />
          </RoleGate>
        ),
      },
      {
        path: 'workflow-review',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <ApprovalsPage />
          </RoleGate>
        ),
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
        path: 'projects',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <MonitoringPage />
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
        path: 'analytics',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <ReportsPage />
          </RoleGate>
        ),
      },
      {
        path: 'proposals',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <MyProposalsPage />
          </RoleGate>
        ),
      },
      {
        path: 'my-application',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <MyProposalsPage />
          </RoleGate>
        ),
      },
      {
        path: 'documents',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <DocumentaryRequirementsPage />
          </RoleGate>
        ),
      },
      {
        path: 'application-status',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ApplicationStatusPage />
          </RoleGate>
        ),
      },
      {
        path: 'project-monitoring',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ProponentDashboard />
          </RoleGate>
        ),
      },
      {
        path: 'accomplishment-reports',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ProponentDashboard />
          </RoleGate>
        ),
      },
      {
        path: 'equipment',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ProponentDashboard />
          </RoleGate>
        ),
      },
      {
        path: 'finance',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ProponentDashboard />
          </RoleGate>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ProponentDashboard />
          </RoleGate>
        ),
      },
      {
        path: 'profile',
        element: (
          <RoleGate allowedRoles={['applicant', 'proponent']}>
            <ProfilePage />
          </RoleGate>
        ),
      },
      {
        path: 'users',
        element: <Navigate replace to="/dashboard/audit" />,
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

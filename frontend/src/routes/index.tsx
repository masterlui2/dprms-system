import { createBrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import type { ModuleId } from '../config/permissions'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { ActivateAccount } from '../pages/ActivateAccount'
import { GiaProposalRegistration } from '../pages/GiaProposalRegistration'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { ProgramLanding } from '../pages/ProgramLanding'
import { ProposalSubmission } from '../pages/ProposalSubmission'
import { Register } from '../pages/Register'
import { SetupProposalRegistration } from '../pages/SetupProposalRegistration'
import { Unauthorized } from '../pages/Unauthorized'
import { ApprovalsPage } from '../pages/admin/ApprovalsPage'
import { AuditTrailPage } from '../pages/admin/AuditTrailPage'
import { BudgetPage } from '../pages/admin/BudgetPage'
import { InventoryPage } from '../pages/admin/InventoryPage'
import { MonitoringPage } from '../pages/admin/MonitoringPage'
import { ReportsPage } from '../pages/admin/ReportsPage'
import { DashboardHome } from '../pages/dashboard/DashboardHome'
import { ModuleWorkspace } from '../pages/dashboard/ModuleWorkspace'
import { ApplicationStatusPage } from '../pages/proponent/ApplicationStatusPage'
import { DocumentaryRequirementsPage } from '../pages/proponent/DocumentaryRequirementsPage'
import { MyProposalsPage } from '../pages/proponent/MyProposalsPage'
import { ProfilePage } from '../pages/proponent/ProfilePage'
import { ProponentDashboard } from '../pages/proponent/ProponentDashboard'

const protect = (module: ModuleId, element: ReactNode) => (
  <ProtectedRoute module={module}>{element}</ProtectedRoute>
)

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/proposal', element: <ProposalSubmission /> },
  { path: '/programs/setup/register', element: <SetupProposalRegistration /> },
  { path: '/programs/gia/register', element: <GiaProposalRegistration /> },
  { path: '/programs/:program', element: <ProgramLanding /> },
  { path: '/apply/:program', element: <ProposalSubmission /> },
  { path: '/activate/:referenceNo', element: <ActivateAccount /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: protect('dashboard', <DashboardHome />) },

      { path: 'applications', element: protect('applications', <ApprovalsPage />) },
      { path: 'applications/new', element: protect('newApplication', <ProposalSubmission />) },
      { path: 'my-applications', element: protect('myApplications', <MyProposalsPage />) },
      { path: 'my-application', element: protect('myApplications', <MyProposalsPage />) },
      { path: 'proposals', element: protect('myApplications', <MyProposalsPage />) },
      { path: 'application-status', element: protect('myApplications', <ApplicationStatusPage />) },
      { path: 'requirements/upload', element: protect('uploadRequirements', <DocumentaryRequirementsPage />) },
      { path: 'requirements/submitted', element: protect('submittedDocuments', <DocumentaryRequirementsPage />) },
      { path: 'project-overview', element: protect('projectOverview', <ProponentDashboard />) },
      { path: 'milestones', element: protect('milestones', <ProponentDashboard />) },
      { path: 'repayment-ledger', element: protect('repaymentLedger', <ProponentDashboard />) },
      { path: 'equipment-assigned', element: protect('equipmentAssigned', <ProponentDashboard />) },
      { path: 'equipment', element: protect('equipmentAssigned', <ProponentDashboard />) },
      { path: 'finance', element: protect('repaymentLedger', <ProponentDashboard />) },
      { path: 'accomplishment-reports', element: protect('quarterlyReports', <ReportsPage />) },
      { path: 'quarterly-reports', element: protect('quarterlyReports', <ReportsPage />) },
      { path: 'documents', element: protect('documents', <DocumentaryRequirementsPage />) },
      { path: 'profile', element: protect('profile', <ProfilePage />) },

      { path: 'project-management', element: protect('projectManagement', <MonitoringPage />) },
      { path: 'budget-management', element: protect('budgetManagement', <BudgetPage />) },
      { path: 'equipment-tracking', element: protect('equipmentTracking', <InventoryPage />) },
      { path: 'repayment-monitoring', element: protect('repaymentMonitoring', <BudgetPage />) },
      { path: 'document-management', element: protect('documentManagement', <DocumentaryRequirementsPage />) },

      { path: 'application-review', element: protect('applicationReview', <ApprovalsPage />) },
      { path: 'technical-evaluation', element: protect('technicalEvaluation', <ApprovalsPage />) },
      { path: 'project-monitoring', element: protect('projectMonitoring', <MonitoringPage />) },
      { path: 'ai-risk-prediction', element: protect('aiRiskPrediction', <ReportsPage />) },

      { path: 'executive-approval', element: protect('executiveApproval', <ApprovalsPage />) },
      { path: 'projects', element: protect('projects', <MonitoringPage />) },
      { path: 'regional-monitoring', element: protect('regionalMonitoring', <MonitoringPage />) },
      { path: 'ai-analytics', element: protect('aiAnalytics', <ReportsPage />) },
      { path: 'reports', element: protect('reports', <ReportsPage />) },

      { path: 'users', element: protect('userManagement', <ModuleWorkspace title="User Management" description="Manage DPRMS user accounts and account status." />) },
      { path: 'roles', element: protect('roleManagement', <ModuleWorkspace title="Role Management" description="Manage DPRMS roles and role assignments." />) },
      { path: 'programs', element: protect('programManagement', <ModuleWorkspace title="Program Management" description="Manage available DOST programs and program settings." />) },
      { path: 'municipalities', element: protect('municipalityManagement', <ModuleWorkspace title="Municipality Management" description="Manage municipalities used in DPRMS records." />) },
      { path: 'budget-categories', element: protect('budgetCategories', <ModuleWorkspace title="Budget Categories" description="Maintain budget classifications used by project records." />) },
      { path: 'notification-management', element: protect('notificationManagement', <ModuleWorkspace title="Notification Management" description="Configure platform notifications and delivery rules." />) },
      { path: 'audit-logs', element: protect('auditLogs', <AuditTrailPage />) },
      { path: 'backup', element: protect('backup', <ModuleWorkspace title="Backup" description="Manage DPRMS data backup and recovery operations." />) },
      { path: 'system-settings', element: protect('systemSettings', <ModuleWorkspace title="System Settings" description="Manage shared DPRMS platform settings." />) },
    ],
  },
  { path: '*', element: <NotFound /> },
])

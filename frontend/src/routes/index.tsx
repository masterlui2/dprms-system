import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import type { ModuleId } from '../config/permissions'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { ActivateAccount } from '../pages/ActivateAccount'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { ProgramLanding } from '../pages/ProgramLanding'
import { ProposalSubmission } from '../pages/ProposalSubmission'
import { Register } from '../pages/Register'
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
import { MyApplicationPage } from '../pages/proponent/MyApplicationPage'
import { MyProposalPage } from '../pages/proponent/MyProposalPage'
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
  { path: '/programs/setup/register', element: <ProposalSubmission /> },
  { path: '/programs/gia/register', element: <ProposalSubmission /> },
  { path: '/programs/:program', element: <ProgramLanding /> },
  { path: '/apply/:program', element: <ProposalSubmission /> },
  { path: '/activate/:referenceNo', element: <ActivateAccount /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/setup',
    element: <DashboardLayout />,
    children: [
      { path: 'dashboard', element: protect('dashboard', <ProponentDashboard />) },
      { path: 'dashboard/my-application', element: protect('myApplications', <MyApplicationPage />) },
      { path: 'my-application', element: protect('myApplications', <MyApplicationPage />) },
      { path: 'dashboard/documents', element: protect('documents', <DocumentaryRequirementsPage program="SETUP" />) },
      { path: 'dashboard/application-status', element: protect('myApplications', <ApplicationStatusPage />) },
      { path: 'dashboard/project-monitoring', element: protect('projectOverview', <ProponentDashboard />) },
      { path: 'dashboard/equipment', element: protect('equipmentAssigned', <ProponentDashboard />) },
      { path: 'dashboard/finance', element: protect('repaymentLedger', <ProponentDashboard />) },
      { path: 'dashboard/notifications', element: protect('dashboard', <ProponentDashboard />) },
      { path: 'dashboard/profile', element: protect('profile', <ProfilePage />) },
    ],
  },
  {
    path: '/gia',
    element: <DashboardLayout />,
    children: [
      { path: 'dashboard', element: protect('dashboard', <ProponentDashboard />) },
      { path: 'dashboard/my-proposal', element: protect('myApplications', <MyProposalPage />) },
      { path: 'my-proposal', element: protect('myApplications', <MyProposalPage />) },
      { path: 'dashboard/my-application', element: protect('myApplications', <MyProposalPage />) },
      { path: 'my-application', element: protect('myApplications', <MyProposalPage />) },
      { path: 'dashboard/documents', element: protect('documents', <DocumentaryRequirementsPage program="GIA" />) },
      { path: 'dashboard/application-status', element: protect('myApplications', <ApplicationStatusPage />) },
      { path: 'dashboard/project-monitoring', element: protect('projectOverview', <ProponentDashboard />) },
      { path: 'dashboard/accomplishment-reports', element: protect('quarterlyReports', <ReportsPage />) },
      { path: 'dashboard/finance', element: protect('repaymentLedger', <ProponentDashboard />) },
      { path: 'dashboard/notifications', element: protect('dashboard', <ProponentDashboard />) },
      { path: 'dashboard/profile', element: protect('profile', <ProfilePage />) },
    ],
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: protect('dashboard', <DashboardHome />) },
      { path: 'applications', element: protect('applications', <ApprovalsPage />) },
      { path: 'applications/new', element: protect('newApplication', <ProposalSubmission />) },
      { path: 'my-applications', element: protect('myApplications', <MyApplicationPage />) },
      { path: 'my-application', element: protect('myApplications', <MyApplicationPage />) },
      { path: 'proposals', element: protect('myApplications', <MyProposalPage />) },
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
      { path: 'equipment-tracking', element: protect('equipmentTracking', <InventoryPage />) },
      { path: 'repayment-monitoring', element: protect('repaymentMonitoring', <BudgetPage />) },
      { path: 'application-review', element: protect('applicationReview', <ApprovalsPage />) },
      { path: 'project-monitoring', element: protect('projectMonitoring', <MonitoringPage />) },
      { path: 'executive-approval', element: protect('executiveApproval', <ApprovalsPage />) },
      { path: 'projects', element: protect('projects', <MonitoringPage />) },
      { path: 'regional-monitoring', element: protect('regionalMonitoring', <MonitoringPage />) },
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

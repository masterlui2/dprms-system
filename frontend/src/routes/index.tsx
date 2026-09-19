/**
 * System: DPRMS
 * Purpose: Define application routes and role protected navigation.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';

import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import type { ModuleId } from '../config/permissions';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ActivateAccount } from '../pages/ActivateAccount';
import { Landing } from '../pages/Landing';
import { Login } from '../pages/Login';
import { NotFound } from '../pages/NotFound';
import { ProgramLanding } from '../pages/ProgramLanding';
import { ProposalSubmission } from '../pages/ProposalSubmission';
import { Register } from '../pages/Register';
import { Unauthorized } from '../pages/Unauthorized';
import { ApprovalsPage } from '../pages/admin/ApprovalsPage';
import { AuditTrailPage } from '../pages/admin/AuditTrailPage';
import { BudgetPage } from '../pages/admin/BudgetPage';
import { DocumentChecklistPage } from '../pages/admin/DocumentChecklistPage';
import { FileSettingsPage } from '../pages/admin/FileSettingsPage';
import { InventoryPage } from '../pages/admin/InventoryPage';
import { MonitoringPage } from '../pages/admin/MonitoringPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { SystemAdministrationPage } from '../pages/admin/SystemAdministrationPage';
import { DashboardHome } from '../pages/dashboard/DashboardHome';
import { ApplicationStatusPage } from '../pages/proponent/ApplicationStatusPage';
import { DocumentaryRequirementsPage } from '../pages/proponent/DocumentaryRequirementsPage';
import { MyApplicationPage } from '../pages/proponent/MyApplicationPage';
import { MyProposalPage } from '../pages/proponent/MyProposalPage';
import { ProfilePage } from '../pages/proponent/ProfilePage';
import { ProponentDashboard } from '../pages/proponent/ProponentDashboard';
import { RepaymentLedgerPage } from '../pages/proponent/RepaymentLedgerPage';

/** Protect. */
const _protect = (strModule: ModuleId, objElement: ReactNode) => (
    <ProtectedRoute strModule={strModule}>{objElement}</ProtectedRoute>
);

const g_arrRoutes: RouteObject[] = [
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
            { path: 'dashboard', element: _protect('dashboard', <ProponentDashboard />) },
            {
                path: 'dashboard/my-application',
                element: _protect('myApplications', <MyApplicationPage />),
            },
            { path: 'my-application', element: _protect('myApplications', <MyApplicationPage />) },
            {
                path: 'dashboard/documents',
                element: _protect('documents', <DocumentaryRequirementsPage strProgram="SETUP" />),
            },
            {
                path: 'dashboard/application-status',
                element: _protect('myApplications', <ApplicationStatusPage />),
            },
            {
                path: 'dashboard/project-monitoring',
                element: _protect('projectOverview', <ProponentDashboard />),
            },
            {
                path: 'dashboard/equipment',
                element: _protect('equipmentAssigned', <ProponentDashboard />),
            },
            {
                path: 'dashboard/finance',
                element: _protect('repaymentLedger', <RepaymentLedgerPage />),
            },
            {
                path: 'dashboard/notifications',
                element: _protect('dashboard', <ProponentDashboard />),
            },
            { path: 'dashboard/profile', element: _protect('profile', <ProfilePage />) },
        ],
    },
    {
        path: '/gia',
        element: <DashboardLayout />,
        children: [
            { path: 'dashboard', element: _protect('dashboard', <ProponentDashboard />) },
            {
                path: 'dashboard/my-proposal',
                element: _protect('myApplications', <MyProposalPage />),
            },
            { path: 'my-proposal', element: _protect('myApplications', <MyProposalPage />) },
            {
                path: 'dashboard/my-application',
                element: _protect('myApplications', <MyProposalPage />),
            },
            { path: 'my-application', element: _protect('myApplications', <MyProposalPage />) },
            {
                path: 'dashboard/documents',
                element: _protect('documents', <DocumentaryRequirementsPage strProgram="GIA" />),
            },
            {
                path: 'dashboard/application-status',
                element: _protect('myApplications', <ApplicationStatusPage />),
            },
            {
                path: 'dashboard/project-monitoring',
                element: _protect('projectOverview', <ProponentDashboard />),
            },
            {
                path: 'dashboard/accomplishment-reports',
                element: _protect('quarterlyReports', <ReportsPage />),
            },
            {
                path: 'dashboard/finance',
                element: _protect('repaymentLedger', <ProponentDashboard />),
            },
            {
                path: 'dashboard/notifications',
                element: _protect('dashboard', <ProponentDashboard />),
            },
            { path: 'dashboard/profile', element: _protect('profile', <ProfilePage />) },
        ],
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            { index: true, element: _protect('dashboard', <DashboardHome />) },
            { path: 'applications', element: _protect('applications', <ApprovalsPage />) },
            {
                path: 'document-checklist',
                element: _protect('documentChecklist', <DocumentChecklistPage />),
            },
            { path: 'file-settings', element: _protect('fileSettings', <FileSettingsPage />) },
            {
                path: 'applications/new',
                element: _protect('newApplication', <ProposalSubmission />),
            },
            { path: 'my-applications', element: _protect('myApplications', <MyApplicationPage />) },
            { path: 'my-application', element: _protect('myApplications', <MyApplicationPage />) },
            { path: 'proposals', element: _protect('myApplications', <MyProposalPage />) },
            {
                path: 'application-status',
                element: _protect('myApplications', <ApplicationStatusPage />),
            },
            {
                path: 'requirements/upload',
                element: _protect('uploadRequirements', <DocumentaryRequirementsPage />),
            },
            {
                path: 'requirements/submitted',
                element: _protect('submittedDocuments', <DocumentaryRequirementsPage />),
            },
            {
                path: 'project-overview',
                element: _protect('projectOverview', <ProponentDashboard />),
            },
            { path: 'milestones', element: _protect('milestones', <ProponentDashboard />) },
            {
                path: 'repayment-ledger',
                element: _protect('repaymentLedger', <ProponentDashboard />),
            },
            {
                path: 'equipment-assigned',
                element: _protect('equipmentAssigned', <ProponentDashboard />),
            },
            { path: 'equipment', element: _protect('equipmentAssigned', <ProponentDashboard />) },
            { path: 'finance', element: _protect('repaymentLedger', <ProponentDashboard />) },
            {
                path: 'accomplishment-reports',
                element: _protect('quarterlyReports', <ReportsPage />),
            },
            { path: 'quarterly-reports', element: _protect('quarterlyReports', <ReportsPage />) },
            { path: 'documents', element: _protect('documents', <DocumentaryRequirementsPage />) },
            { path: 'profile', element: _protect('profile', <ProfilePage />) },
            {
                path: 'equipment-tracking',
                element: _protect('equipmentTracking', <InventoryPage />),
            },
            {
                path: 'repayment-monitoring',
                element: _protect('repaymentMonitoring', <BudgetPage />),
            },
            {
                path: 'repayment-monitoring/:projectId',
                element: _protect('repaymentMonitoring', <BudgetPage />),
            },
            {
                path: 'application-review',
                element: _protect('applicationReview', <ApprovalsPage />),
            },
            {
                path: 'project-monitoring',
                element: _protect('projectMonitoring', <MonitoringPage />),
            },
            {
                path: 'executive-approval',
                element: _protect('executiveApproval', <ApprovalsPage />),
            },
            { path: 'projects', element: _protect('projects', <MonitoringPage />) },
            {
                path: 'regional-monitoring',
                element: _protect('regionalMonitoring', <MonitoringPage />),
            },
            { path: 'reports', element: _protect('reports', <ReportsPage />) },
            {
                path: 'users',
                element: _protect('userManagement', <SystemAdministrationPage strModule="users" />),
            },
            {
                path: 'roles',
                element: _protect('roleManagement', <SystemAdministrationPage strModule="roles" />),
            },
            {
                path: 'programs',
                element: _protect(
                    'programManagement',
                    <SystemAdministrationPage strModule="programs" />,
                ),
            },
            {
                path: 'municipalities',
                element: _protect(
                    'municipalityManagement',
                    <SystemAdministrationPage strModule="municipalities" />,
                ),
            },
            {
                path: 'budget-categories',
                element: _protect(
                    'budgetCategories',
                    <SystemAdministrationPage strModule="budgets" />,
                ),
            },
            {
                path: 'notification-management',
                element: _protect(
                    'notificationManagement',
                    <SystemAdministrationPage strModule="notifications" />,
                ),
            },
            { path: 'audit-logs', element: _protect('auditLogs', <AuditTrailPage />) },
            {
                path: 'backup',
                element: _protect('backup', <SystemAdministrationPage strModule="backup" />),
            },
            {
                path: 'system-settings',
                element: _protect(
                    'systemSettings',
                    <SystemAdministrationPage strModule="settings" />,
                ),
            },
        ],
    },
    {
        path: '/admin',
        element: <DashboardLayout />,
        children: [
            {
                path: 'document-checklist',
                element: _protect('documentChecklist', <DocumentChecklistPage />),
            },
            { path: 'applications', element: _protect('applications', <ApprovalsPage />) },
            { path: 'approvals', element: _protect('applications', <ApprovalsPage />) },
            { path: 'projects', element: _protect('projects', <MonitoringPage />) },
        ],
    },
    { path: '*', element: <NotFound /> },
];

export const g_objRouter = createBrowserRouter(
    g_arrRoutes.map((objRoute) => ({ ...objRoute, errorElement: <RouteErrorBoundary /> })),
);

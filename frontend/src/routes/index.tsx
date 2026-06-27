import { createBrowserRouter } from 'react-router-dom'

import { DashboardLayout } from '../layouts/DashboardLayout'
import { Dashboard } from '../pages/Dashboard'
import { Landing } from '../pages/Landing'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { ProposalSubmission } from '../pages/ProposalSubmission'

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
        element: <Dashboard />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

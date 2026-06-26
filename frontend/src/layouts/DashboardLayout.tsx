import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '../utils/cn'

const navigationItems = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Projects', to: '/dashboard#projects' },
  { label: 'Resources', to: '/dashboard#resources' },
  { label: 'Reports', to: '/dashboard#reports' },
]

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-[#105c4a] text-sm font-bold text-white">
            D
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">DOST</p>
            <h1 className="text-lg font-bold">DPRMS</h1>
          </div>
        </div>

        <nav className="mt-10 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-[#e6f3ef] text-[#105c4a]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
              key={item.label}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Capstone System
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Project and resource monitoring workspace.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#105c4a]">
                DOST Project and Resource Management System
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Dashboard</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:block">
                Admin Workspace
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-[#f4c542] text-sm font-bold text-slate-950">
                UI
              </div>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold',
                    isActive ? 'bg-[#e6f3ef] text-[#105c4a]' : 'text-slate-600',
                  )
                }
                key={item.label}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

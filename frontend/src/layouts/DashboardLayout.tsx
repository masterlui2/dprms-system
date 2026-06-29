import { useState } from 'react'
import { Bell, PanelLeft, Search } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'

import { AdminSidebar } from '../components/dashboard/AdminSidebar'
import { ROLE_LABEL, getMockUser } from '../lib/mockAuth'
import { cn } from '../utils/cn'

export function DashboardLayout() {
  const user = getMockUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-[#eef5fb] text-slate-900 lg:grid',
        sidebarCollapsed
          ? 'lg:grid-cols-[84px_minmax(0,1fr)]'
          : 'lg:grid-cols-[280px_minmax(0,1fr)]',
      )}
    >
      <AdminSidebar collapsed={sidebarCollapsed} user={user} />

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#d8e1ee] bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
            <button
              aria-pressed={sidebarCollapsed}
              aria-label="Sidebar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8e1ee] bg-white text-[#1d3352] shadow-sm"
              onClick={() => setSidebarCollapsed((current) => !current)}
              type="button"
            >
              <PanelLeft className="h-5 w-5" />
            </button>

            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-2xl border border-[#d8e1ee] bg-[#fbfdff] pl-12 pr-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                placeholder="Search projects, MSMEs, equipment..."
                type="text"
              />
            </label>

            <button
              aria-label="Notifications"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-[#1d3352] transition hover:bg-[#f3f8fe] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              type="button"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#ff8a1f]" />
            </button>

            <div className="flex items-center gap-3 border-l border-[#e2e8f0] pl-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0f53b7] text-sm font-black text-white">
                {user.initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{ROLE_LABEL[user.role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

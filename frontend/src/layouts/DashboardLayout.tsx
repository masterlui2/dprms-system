import { useState } from 'react'
import { Bell, ChevronDown, Home, PanelLeft, Search, UserCircle2 } from 'lucide-react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'

import { AdminSidebar } from '../components/dashboard/AdminSidebar'
import { NotificationPanel } from '../components/admin/NotificationPanel'
import { ROLE_LABEL, clearMockUser, getMockUser } from '../lib/mockAuth'
import { cn } from '../utils/cn'

export function DashboardLayout() {
  const navigate = useNavigate()
  const user = getMockUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

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
      {mobileSidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <AdminSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        user={user}
      />

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#d8e1ee] bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
            <button
              aria-expanded={mobileSidebarOpen}
              aria-pressed={sidebarCollapsed}
              aria-label="Sidebar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8e1ee] bg-white text-[#1d3352] shadow-sm"
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) {
                  setSidebarCollapsed((current) => !current)
                } else {
                  setMobileSidebarOpen(true)
                }
              }}
              type="button"
            >
              <PanelLeft className="h-5 w-5" />
            </button>

            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-2xl border border-[#d8e1ee] bg-[#fbfdff] pl-12 pr-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                placeholder={
                  user.role === 'admin'
                    ? 'Search projects, MSMEs, equipment...'
                    : 'Search proposal status, notices, reports...'
                }
                type="text"
              />
            </label>

            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e1ee] bg-white px-3 text-sm font-bold text-[#073b82] shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:px-4"
              title="Back to landing page"
              to="/"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Public Portal</span>
            </Link>

            <div className="relative">
              <button
                aria-expanded={notificationsOpen}
                aria-label="Notifications"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-[#1d3352] transition hover:bg-[#f3f8fe] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setAccountMenuOpen(false)
                }}
                type="button"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#ff8a1f]" />
              </button>
              {notificationsOpen ? (
                <NotificationPanel
                  onClose={() => setNotificationsOpen(false)}
                  role={user.role}
                />
              ) : null}
            </div>

            <div className="relative border-l border-[#e2e8f0] pl-4">
              <button
                aria-expanded={accountMenuOpen}
                aria-label="Account"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-transparent px-2 text-[#1d3352] transition hover:bg-[#f3f8fe] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                onClick={() => {
                  setAccountMenuOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
                type="button"
              >
                <UserCircle2 className="h-7 w-7" />
                <ChevronDown className="hidden h-4 w-4 sm:block" />
              </button>

              {accountMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-2xl">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0f53b7] text-sm font-black text-white">
                        {user.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-slate-900">
                          {user.name}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {ROLE_LABEL[user.role]}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 px-4 py-4">
                    <div className="rounded-xl bg-[#f7fbff] px-3 py-3 text-xs text-slate-500">
                      Signed in as <span className="font-bold text-slate-700">{user.email}</span>
                    </div>
                    <button
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => {
                        clearMockUser()
                        setAccountMenuOpen(false)
                        navigate('/login')
                      }}
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
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

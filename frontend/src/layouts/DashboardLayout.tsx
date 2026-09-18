import { useEffect, useState } from 'react'
import { Bell, ChevronDown, LogOut, PanelLeft, Search } from 'lucide-react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'

import { AdminSidebar } from '../components/dashboard/AdminSidebar'
import { NotificationPanel } from '../components/admin/NotificationPanel'
import { SiteHeader } from '../components/landing/SiteHeader'
import { ROLE_LABEL, ROLES } from '../config/permissions'
import { clearMockUser, getMockUser } from '../lib/mockAuth'
import { initializeDownloadDirectories } from '../services/downloadManager'
import { AccountExportDirectory } from '../components/common/ExportDirectorySettings'
import { cn } from '../utils/cn'

export function DashboardLayout() {
  const navigate = useNavigate()
  const user = getMockUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  useEffect(() => {
    const activeUser = getMockUser()
    if (!activeUser) return
    void initializeDownloadDirectories(activeUser).catch((error) => {
      console.warn('Download folders could not be initialized on cold start.', error)
    })
  }, [])

  if (!user) {
    return <Navigate replace to="/login" />
  }

  // The beneficiary portal keeps its existing header-based experience.
  // The AdminSidebar is reserved for internal DPRMS roles.
  if (user.role === ROLES.PROPONENT) {
    return (
      <div className="min-h-screen bg-[#f4f8fc] text-slate-950">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'h-screen overflow-hidden bg-[#eef5fb] text-slate-900 lg:grid',
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

      <div className="min-w-0 flex flex-col h-screen overflow-hidden bg-[#eef5fb]">
        <header className="shrink-0 border-b border-[#d8e1ee] bg-white/95 backdrop-blur">
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
                  user.role === ROLES.SYSTEM_ADMIN
                    ? 'Search projects, MSMEs, equipment...'
                    : 'Search proposal status, notices, reports...'
                }
                type="text"
              />
            </label>

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
                aria-label="Account menu"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 text-[#1d3352] shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                onClick={() => {
                  setAccountMenuOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
                type="button"
              >
                <div className="grid size-8 place-items-center rounded-full bg-[#0f53b7] text-xs font-bold text-white shadow-xs shrink-0">
                  {user.initials}
                </div>
                <span className="hidden text-sm font-bold text-slate-800 sm:inline max-w-[130px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="size-4 text-slate-400" />
              </button>

              {accountMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-[#0f53b7] text-sm font-bold text-white shadow-xs shrink-0">
                        {user.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 leading-snug">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 mt-0.5">
                          {user.email}
                        </p>
                        <div className="mt-1.5 inline-flex items-center rounded-md bg-blue-50 border border-blue-100/80 px-2 py-0.5 text-[11px] font-semibold text-[#0f53b7]">
                          {ROLE_LABEL[user.role]}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <AccountExportDirectory user={user} />
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => {
                        clearMockUser()
                        setAccountMenuOpen(false)
                        navigate('/login')
                      }}
                      type="button"
                    >
                      <LogOut className="size-4 text-slate-400 group-hover:text-rose-600 transition" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 max-w-full flex-1 overflow-y-auto bg-[#eef5fb] px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { LogOut, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import logoImage from '../../assets/logo.png'
import { getSidebarItems, type SidebarItem, type SidebarSubItem } from '../../config/sidebarItems'
import { ROLE_LABEL } from '../../config/permissions'
import { clearMockUser, type MockUser } from '../../lib/mockAuth'
import { cn } from '../../utils/cn'

function SidebarItem({
  collapsed,
  isActive,
  item,
  onNavigate,
}: {
  collapsed: boolean
  isActive: boolean
  item: SidebarItem
  onNavigate?: () => void
}) {
  const location = useLocation()
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0)
  const isParentActive =
    item.route === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.route)

  const className = cn(
    'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
    collapsed && 'justify-center px-0',
    isActive
      ? 'bg-white text-[#073b82] shadow-sm ring-1 ring-[#d7e5f5]'
      : 'text-slate-700 hover:bg-white/75 hover:text-[#073b82]',
  )

  return (
    <div className="space-y-1">
      <NavLink className={className} onClick={onNavigate} title={item.label} to={item.route}>
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      </NavLink>

      {!collapsed && hasSubItems && isParentActive && item.subItems ? (
        <div className="ml-4 space-y-0.5 border-l-2 border-[#d8e1ee] pl-2 pt-1">
          {item.subItems.map((sub: SidebarSubItem) => {
            const queryParam = sub.route.split('?')[1]
            const isSubActive = queryParam
              ? location.search.includes(queryParam)
              : !location.search || location.search === ''

            return (
              <NavLink
                key={sub.label}
                to={sub.route}
                onClick={onNavigate}
                className={cn(
                  'flex h-8 items-center rounded-md px-2.5 text-xs font-semibold transition',
                  isSubActive
                    ? 'bg-blue-50/90 font-bold text-[#073b82]'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                )}
              >
                <span className="truncate">{sub.label}</span>
              </NavLink>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function AdminSidebar({
  collapsed = false,
  mobileOpen = false,
  onClose,
  user,
}: {
  collapsed?: boolean
  mobileOpen?: boolean
  onClose?: () => void
  user: MockUser
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const visible = getSidebarItems(user.role)
  const isActive = (route: string) => route === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname.startsWith(route)

  function handleSignOut() {
    clearMockUser()
    onClose?.()
    navigate('/login')
  }

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 w-[280px] border-r border-[#d8e1ee] bg-[#f7fbff] shadow-xl transition-transform lg:static lg:z-auto lg:h-full lg:w-auto lg:translate-x-0 lg:shadow-none',
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
    )}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-[#d8e1ee] px-6 py-4">
          <NavLink
            className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100', collapsed && 'justify-center px-0')}
            onClick={onClose}
            title="DOST DPRMS"
            to="/dashboard"
          >
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden">
              <img alt="DOST XI" className="size-14 object-contain" src={logoImage} />
            </span>
            {!collapsed ? (
              <span className="min-w-0 leading-tight">
                <span className="block text-lg font-extrabold text-[#073b82]">DOST</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">DPRMS</span>
              </span>
            ) : null}
          </NavLink>
          <button aria-label="Close navigation" className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white lg:hidden" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed ? <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Modules</p> : null}
          <nav className="space-y-1">
            {visible.map((item) => {
              return (
                <div key={item.id}>
                  <SidebarItem
                    collapsed={collapsed}
                    isActive={isActive(item.route)}
                    item={item}
                    onNavigate={onClose}
                  />
                </div>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-[#d8e1ee] bg-white px-3 py-4">
          {!collapsed ? (
            <div className="px-2 pb-3">
              <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="truncate text-[11px] text-slate-500">{ROLE_LABEL[user.role]}</div>
            </div>
          ) : null}
          <button
            className={cn('flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100', collapsed && 'justify-center px-0')}
            onClick={handleSignOut}
            title="Sign out"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </div>
    </aside>
  )
}

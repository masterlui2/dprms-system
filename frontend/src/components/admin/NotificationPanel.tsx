import { Bell, CalendarDays, CheckCheck, CircleDollarSign, ClipboardCheck, FileText, PackageSearch, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotificationChanges,
  type AppNotification,
} from '../../services/notificationStore'

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function notificationIcon(notification: AppNotification) {
  if (notification.type.includes('OVERDUE') || notification.type.includes('PRIORITY')) return TriangleAlert
  if (notification.category === 'FINANCE') return CircleDollarSign
  if (notification.category === 'EQUIPMENT') return PackageSearch
  if (notification.category === 'CHECKLIST') return ClipboardCheck
  if (notification.category === 'PROPOSAL') return FileText
  return CalendarDays
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const unreadCount = notifications.filter((item) => !item.is_read).length

  useEffect(() => {
    let active = true
    const refresh = () => fetchNotifications()
      .then((result) => { if (active) setNotifications(result.notifications) })
      .catch(() => { if (active) setNotifications([]) })
      .finally(() => { if (active) setLoading(false) })
    void refresh()
    const unsubscribe = subscribeToNotificationChanges(refresh)
    return () => { active = false; unsubscribe() }
  }, [])

  async function openNotification(notification: AppNotification) {
    if (!notification.is_read) {
      await markNotificationRead(notification.id)
      setNotifications((items) => items.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item))
    }
    onClose()
    if (notification.action_url) navigate(notification.action_url)
  }

  async function markAllRead() {
    await markAllNotificationsRead()
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
  }

  return (
    <aside className="isolate absolute right-0 top-[calc(100%+0.75rem)] z-[100] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-2xl">
      <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><Bell className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-[#073b82]">Notifications</p>
          <p className="mt-0.5 text-xs text-slate-500">{unreadCount} unread</p>
        </div>
        <button aria-label="Close notifications" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications</p>
        ) : notifications.map((notification) => {
          const Icon = notificationIcon(notification)
          return (
            <button
              className={`relative flex w-full items-start gap-3 overflow-hidden px-4 py-4 text-left transition hover:bg-blue-50 ${notification.is_read ? 'bg-white' : 'bg-[#f5f9ff]'}`}
              key={notification.id}
              onClick={() => void openNotification(notification)}
              type="button"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#0f53b7]"><Icon className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-start gap-2">
                  <span className="line-clamp-2 min-w-0 break-words text-sm font-bold leading-5 text-slate-900">{notification.title}</span>
                  {!notification.is_read ? <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-[#ff8a1f]" /> : null}
                </span>
                <span className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">{notification.message}</span>
                <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-bold">
                  {notification.actor_name ? <span className="text-slate-500">{notification.actor_name}{notification.actor_role ? ` · ${notification.actor_role}` : ''}</span> : null}
                  {notification.program ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[#0f53b7]">{notification.program}</span> : null}
                  <span className="text-slate-400">{relativeTime(notification.created_at)}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {notifications.length > 0 ? (
        <div className="flex items-center justify-end border-t border-slate-200 px-4 py-3">
          <button className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline" onClick={() => void markAllRead()} type="button">
            <CheckCheck className="size-3.5" /> Mark all read
          </button>
        </div>
      ) : null}
    </aside>
  )
}

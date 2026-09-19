import { Bell, CheckCheck, CircleDollarSign, ClipboardCheck, FileText, PackageSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  subscribeToNotificationChanges,
  type AppNotification,
} from '../../services/notificationStore'

function iconFor(category: string) {
  if (category === 'FINANCE') return CircleDollarSign
  if (category === 'EQUIPMENT') return PackageSearch
  if (category === 'CHECKLIST') return ClipboardCheck
  if (category === 'PROPOSAL') return FileText
  return Bell
}

function notificationDate(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NotificationHistory() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

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
    if (notification.action_url) navigate(notification.action_url)
  }

  async function toggleUnread(notification: AppNotification) {
    if (notification.is_read) {
      await markNotificationUnread(notification.id)
    } else {
      await markNotificationRead(notification.id)
    }
    setNotifications((items) => items.map((item) =>
      item.id === notification.id ? { ...item, is_read: !item.is_read } : item))
  }

  async function markAllRead() {
    await markAllNotificationsRead()
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><Bell className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 ? (
          <button className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline" onClick={() => void markAllRead()} type="button">
            <CheckCheck className="size-4" /> Mark all read
          </button>
        ) : null}
      </header>

      {loading ? <p className="px-5 py-10 text-center text-sm text-slate-500">Loading...</p> : null}
      {!loading && notifications.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">No notifications yet</p> : null}
      {!loading && notifications.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => {
            const Icon = iconFor(notification.category)
            return (
              <article className={notification.is_read ? 'bg-white' : 'bg-blue-50/40'} key={notification.id}>
                <div className="flex items-start gap-3 px-5 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#0f53b7]"><Icon className="size-4" /></span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => void openNotification(notification)} type="button">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{notification.title}</span>
                      {!notification.is_read ? <span className="size-2 rounded-full bg-[#ff8a1f]" /> : null}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {notification.actor_name ? <span>{notification.actor_name}{notification.actor_role ? ` · ${notification.actor_role}` : ''}</span> : null}
                      {notification.program ? <span className="rounded bg-blue-50 px-1.5 py-0.5 font-bold text-[#0f53b7]">{notification.program}</span> : null}
                      <span>{notificationDate(notification.created_at)}</span>
                    </span>
                  </button>
                  <button className="shrink-0 text-xs font-bold text-slate-500 hover:text-[#0f53b7]" onClick={() => void toggleUnread(notification)} type="button">
                    Mark {notification.is_read ? 'unread' : 'read'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

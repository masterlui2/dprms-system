import {
  Bell,
  CheckCheck,
  FileCheck2,
  TriangleAlert,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'

const initialNotifications = [
  {
    id: 'notification-1',
    title: 'Proposal ready for review',
    description: 'PR-2026-041 completed document screening.',
    time: '8 min ago',
    read: false,
    icon: FileCheck2,
  },
  {
    id: 'notification-2',
    title: 'Budget utilization alert',
    description: 'Cold Storage has reached 99% utilization.',
    time: '42 min ago',
    read: false,
    icon: Wallet,
  },
  {
    id: 'notification-3',
    title: 'Compliance report overdue',
    description: 'P-211 requires an accomplishment report.',
    time: '2 hrs ago',
    read: false,
    icon: TriangleAlert,
  },
  {
    id: 'notification-4',
    title: 'Proposal approved',
    description: 'Highland Coffee received final approval.',
    time: 'Yesterday',
    read: true,
    icon: CheckCheck,
  },
]

export function NotificationPanel({
  onClose,
}: {
  onClose: () => void
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <aside className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-2xl">
      <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-[#073b82]">Notifications</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {unreadCount} unread updates
          </p>
        </div>
        <button
          aria-label="Close notifications"
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
        {notifications.map((notification) => (
          <button
            className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-blue-50/50 ${
              notification.read ? 'bg-white' : 'bg-blue-50/30'
            }`}
            key={notification.id}
            onClick={() =>
              setNotifications((items) =>
                items.map((item) =>
                  item.id === notification.id ? { ...item, read: true } : item,
                ),
              )
            }
            type="button"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#0f53b7]">
              <notification.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-bold text-slate-900">
                  {notification.title}
                </span>
                {!notification.read ? (
                  <span
                    aria-label="Unread"
                    className="size-2 shrink-0 rounded-full bg-[#ff8a1f]"
                  />
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {notification.description}
              </span>
              <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                {notification.time}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
        <button
          className="text-xs font-bold text-[#0f53b7] hover:underline"
          onClick={() =>
            setNotifications((items) =>
              items.map((item) => ({ ...item, read: true })),
            )
          }
          type="button"
        >
          Mark all as read
        </button>
        <button
          className="text-xs font-bold text-slate-600 hover:text-[#0f53b7]"
          type="button"
        >
          View all notifications
        </button>
      </div>
    </aside>
  )
}

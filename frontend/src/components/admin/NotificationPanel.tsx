import {
  Bell,
  CheckCheck,
  FileCheck2,
  FilePenLine,
  TriangleAlert,
  UserCheck2,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

import type { UserRole } from '../../lib/mockAuth'

const NOTIFICATIONS_BY_ROLE = {
  admin: [
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
  ],
  applicant: [
    {
      id: 'notification-9',
      title: 'Application submitted',
      description: 'Your guest submission is available in the Beneficiary Portal.',
      time: 'Just now',
      read: false,
      icon: CheckCheck,
    },
    {
      id: 'notification-10',
      title: 'Document validation pending',
      description: 'DOST will review uploaded requirements and post remarks here.',
      time: 'Today',
      read: false,
      icon: FileCheck2,
    },
    {
      id: 'notification-11',
      title: 'Portal activated',
      description: 'You can now track application status and project monitoring updates.',
      time: 'Today',
      read: true,
      icon: UserCheck2,
    },
  ],
  proponent: [
    {
      id: 'notification-5',
      title: 'Revision requested',
      description: 'PR-2026-029 needs an updated quotation attachment.',
      time: '14 min ago',
      read: false,
      icon: FilePenLine,
    },
    {
      id: 'notification-6',
      title: 'Proposal endorsed',
      description: 'PR-2026-041 advanced to technical evaluation.',
      time: '1 hr ago',
      read: false,
      icon: UserCheck2,
    },
    {
      id: 'notification-7',
      title: 'Report deadline reminder',
      description: 'Your quarterly accomplishment report is due in 4 days.',
      time: 'Today',
      read: false,
      icon: TriangleAlert,
    },
    {
      id: 'notification-8',
      title: 'Submission received',
      description: 'Your packaging facility proposal was logged successfully.',
      time: 'Yesterday',
      read: true,
      icon: CheckCheck,
    },
  ],
} satisfies Record<UserRole, Array<{
  id: string
  title: string
  description: string
  time: string
  read: boolean
  icon: LucideIcon
}>>

export function NotificationPanel({
  onClose,
  role,
}: {
  onClose: () => void
  role: UserRole
}) {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_BY_ROLE[role])
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

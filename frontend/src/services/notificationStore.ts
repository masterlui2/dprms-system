import { useCallback, useEffect, useState } from 'react'

import api from '../lib/axios'

export interface AppNotification {
  id: number
  type: string
  category: string
  program: 'SETUP' | 'GIA' | null
  actor_name: string | null
  actor_role: string | null
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

const NOTIFICATIONS_CHANGED = 'dprms:notifications-changed'
const NOTIFICATIONS_CHANNEL = 'dprms-notifications'
const NOTIFICATIONS_STORAGE_EVENT = 'dprms:notification_event'

function broadcastNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(NOTIFICATIONS_CHANNEL)
    channel.postMessage({ type: 'changed', at: Date.now() })
    channel.close()
  }

  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_EVENT, String(Date.now()))
  } catch {
    // The same-tab event above still keeps the current session in sync.
  }
}

export async function fetchNotifications() {
  const response = await api.get<{
    data: { unread_count: number; notifications: AppNotification[] }
  }>('/notifications')
  return response.data.data
}

export async function markNotificationRead(id: number) {
  await api.patch(`/notifications/${id}/read`)
  broadcastNotificationsChanged()
}

export async function markNotificationUnread(id: number) {
  await api.patch(`/notifications/${id}/unread`)
  broadcastNotificationsChanged()
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all')
  broadcastNotificationsChanged()
}

export function notifyNotificationsChanged() {
  broadcastNotificationsChanged()
}

export function subscribeToNotificationChanges(callback: () => void | Promise<void>) {
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(NOTIFICATIONS_CHANNEL) : null
  const handleChange = () => { void callback() }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === NOTIFICATIONS_STORAGE_EVENT) handleChange()
  }

  window.addEventListener(NOTIFICATIONS_CHANGED, handleChange)
  window.addEventListener('storage', handleStorage)
  channel?.addEventListener('message', handleChange)

  return () => {
    window.removeEventListener(NOTIFICATIONS_CHANGED, handleChange)
    window.removeEventListener('storage', handleStorage)
    channel?.removeEventListener('message', handleChange)
    channel?.close()
  }
}

export function useUnreadNotificationCount(enabled = true, intervalMs = 15000) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const result = await fetchNotifications()
      setCount(result.unread_count)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }
    void refresh()
    const timer = window.setInterval(refresh, intervalMs)
    const unsubscribe = subscribeToNotificationChanges(refresh)
    return () => {
      window.clearInterval(timer)
      unsubscribe()
    }
  }, [enabled, intervalMs, refresh])

  return count
}

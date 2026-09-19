/**
 * System: DPRMS
 * Purpose: Manage notification store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useCallback, useEffect, useState } from 'react';
import { reportError } from '../utils/error_reporting';

import g_objApi from '../lib/axios';

export interface AppNotification
{
    id: number;
    type: string;
    category: string;
    program: 'SETUP' | 'GIA' | null;
    actor_name: string | null;
    actor_role: string | null;
    title: string;
    message: string;
    action_url: string | null;
    is_read: boolean;
    created_at: string;
}

const NOTIFICATIONS_CHANGED = 'dprms:notifications-changed';
const NOTIFICATIONS_CHANNEL = 'dprms-notifications';
const NOTIFICATIONS_STORAGE_EVENT = 'dprms:notification_event';

/** Broadcast notifications changed. */
function _broadcastNotificationsChanged()
{
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

    if ('BroadcastChannel' in window)
    {
        const objChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
        objChannel.postMessage({ type: 'changed', at: Date.now() });
        objChannel.close();
    }

    try
    {
        window.localStorage.setItem(NOTIFICATIONS_STORAGE_EVENT, String(Date.now()));
    } catch (errCaught)
    {
        reportError(errCaught, 'notification_store: broadcast notifications changed failed.');

        // The same-tab event above still keeps the current session in sync.
    }
}

/** Fetch notifications. */
export async function fetchNotifications()
{
    try
    {
        const objResponse = await g_objApi.get<{
            data: { unread_count: number; notifications: AppNotification[]; };
        }>('/notifications');
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'notification_store: fetch notifications failed.');
        throw errOperation;
    }
}

/** Mark notification read. */
export async function markNotificationRead(intId: number)
{
    try
    {
        await g_objApi.patch(`/notifications/${intId}/read`);
        _broadcastNotificationsChanged();
    } catch (errOperation)
    {
        reportError(errOperation, 'notification_store: mark notification read failed.');
        throw errOperation;
    }
}

/** Mark notification unread. */
export async function markNotificationUnread(intId: number)
{
    try
    {
        await g_objApi.patch(`/notifications/${intId}/unread`);
        _broadcastNotificationsChanged();
    } catch (errOperation)
    {
        reportError(errOperation, 'notification_store: mark notification unread failed.');
        throw errOperation;
    }
}

/** Mark all notifications read. */
export async function markAllNotificationsRead()
{
    try
    {
        await g_objApi.patch('/notifications/read-all');
        _broadcastNotificationsChanged();
    } catch (errOperation)
    {
        reportError(errOperation, 'notification_store: mark all notifications read failed.');
        throw errOperation;
    }
}

/** Notify notifications changed. */
export function notifyNotificationsChanged()
{
    _broadcastNotificationsChanged();
}

/** Subscribe to notification changes. */
export function subscribeToNotificationChanges(callback: () => void | Promise<void>)
{
    const objChannel =
        'BroadcastChannel' in window ? new BroadcastChannel(NOTIFICATIONS_CHANNEL) : null;
    /** Handle change. */
    const _handleChange = () =>
    {
        void callback();
    };
    /** Handle storage. */
    const _handleStorage = (objEvent: StorageEvent) =>
    {
        if (objEvent.key === NOTIFICATIONS_STORAGE_EVENT)
        {
            _handleChange();
        }
    };

    window.addEventListener(NOTIFICATIONS_CHANGED, _handleChange);
    window.addEventListener('storage', _handleStorage);
    objChannel?.addEventListener('message', _handleChange);

    return () =>
    {
        window.removeEventListener(NOTIFICATIONS_CHANGED, _handleChange);
        window.removeEventListener('storage', _handleStorage);
        objChannel?.removeEventListener('message', _handleChange);
        objChannel?.close();
    };
} /* end subscribeToNotificationChanges */

/** Coordinate unread notification count state and effects. */
export function useUnreadNotificationCount(blnEnabled = true, intIntervalMs = 15000)
{
    const [intCount, setIntCount] = useState(0);

    const _refresh = useCallback(async () =>
    {
        try
        {
            const objResult = await fetchNotifications();
            setIntCount(objResult.unread_count);
        } catch (errCaught)
        {
            reportError(errCaught, 'notification_store: refresh failed.');

            setIntCount(0);
        }
    }, []);

    useEffect(() =>
    {
        if (!blnEnabled)
        {
            setIntCount(0);
            return;
        }
        void _refresh();
        const intTimer = window.setInterval(_refresh, intIntervalMs);
        const _unsubscribe = subscribeToNotificationChanges(_refresh);
        return () =>
        {
            window.clearInterval(intTimer);
            _unsubscribe();
        };
    }, [blnEnabled, intIntervalMs, _refresh]);

    return intCount;
} /* end useUnreadNotificationCount */

/**
 * System: DPRMS
 * Purpose: Render notification panel for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Bell,
    CalendarDays,
    CheckCheck,
    CircleDollarSign,
    ClipboardCheck,
    FileText,
    PackageSearch,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import
{
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    subscribeToNotificationChanges,
    type AppNotification,
} from '../../services/notification_store';

/** Relative time. */
function _relativeTime(strValue: string)
{
    const intMinutes = Math.max(0, Math.round((Date.now() - new Date(strValue).getTime()) / 60000));
    if (intMinutes < 1)
    {
        return 'Just now';
    }
    if (intMinutes < 60)
    {
        return `${intMinutes}m ago`;
    }
    if (intMinutes < 1440)
    {
        return `${Math.floor(intMinutes / 60)}h ago`;
    }
    return new Date(strValue).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** Notification icon. */
function _notificationIcon(objNotification: AppNotification)
{
    if (objNotification.type.includes('OVERDUE') || objNotification.type.includes('PRIORITY'))
    {
        return TriangleAlert;
    }
    if (objNotification.category === 'FINANCE')
    {
        return CircleDollarSign;
    }
    if (objNotification.category === 'EQUIPMENT')
    {
        return PackageSearch;
    }
    if (objNotification.category === 'CHECKLIST')
    {
        return ClipboardCheck;
    }
    if (objNotification.category === 'PROPOSAL')
    {
        return FileText;
    }
    return CalendarDays;
}

/** Render notification panel and its available actions. */
export function NotificationPanel({ onClose }: { onClose: () => void; })
{
    const _navigate = useNavigate();
    const [arrNotifications, setArrNotifications] = useState<AppNotification[]>([]);
    const [blnLoading, setBlnLoading] = useState(true);
    const intUnreadCount = arrNotifications.filter((objItem) => !objItem.is_read).length;

    useEffect(
        () =>
        {
            let blnActive = true;
            /** Refresh. */
            const _refresh = () =>
                fetchNotifications()
                    .then((objResult) =>
                    {
                        if (blnActive)
                        {
                            setArrNotifications(objResult.notifications);
                        }
                    })
                    .catch(() =>
                    {
                        if (blnActive)
                        {
                            setArrNotifications([]);
                        }
                    })
                    .finally(() =>
                    {
                        if (blnActive)
                        {
                            setBlnLoading(false);
                        }
                    });
            void _refresh();
            const _unsubscribe = subscribeToNotificationChanges(_refresh);
            return () =>
            {
                blnActive = false;
                _unsubscribe();
            };
        } /* end NotificationPanel */,
        [],
    );

    /** Open notification. */
    async function _openNotification(objNotification: AppNotification)
    {
        try
        {
            if (!objNotification.is_read)
            {
                await markNotificationRead(objNotification.id);
                setArrNotifications((arrItems) =>
                    arrItems.map((objItem) =>
                        objItem.id === objNotification.id ? { ...objItem, is_read: true } : objItem,
                    ),
                );
            }
            onClose();
            if (objNotification.action_url)
            {
                _navigate(objNotification.action_url);
            }
        } catch (errOperation)
        {
            reportError(errOperation, 'NotificationPanel: open notification failed.');
            throw errOperation;
        }
    }

    /** Mark all read. */
    async function _markAllRead()
    {
        try
        {
            await markAllNotificationsRead();
            setArrNotifications((arrItems) =>
                arrItems.map((objItem) => ({ ...objItem, is_read: true })),
            );
        } catch (errOperation)
        {
            reportError(errOperation, 'NotificationPanel: mark all read failed.');
            throw errOperation;
        }
    }

    return (
        <aside className="isolate absolute right-0 top-[calc(100%+0.75rem)] z-[100] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                    <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-[#073b82]">Notifications</p>
                    <p className="mt-0.5 text-xs text-slate-500">{intUnreadCount} unread</p>
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
                {blnLoading ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">Loading...</p>
                ) : arrNotifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications</p>
                ) : (
                    arrNotifications.map((objNotification) =>
                    {
                        const Icon = _notificationIcon(objNotification);
                        return (
                            <button
                                className={`relative flex w-full items-start gap-3 overflow-hidden px-4 py-4 text-left transition hover:bg-blue-50 ${objNotification.is_read ? 'bg-white' : 'bg-[#f5f9ff]'}`}
                                key={objNotification.id}
                                onClick={() => void _openNotification(objNotification)}
                                type="button"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#0f53b7]">
                                    <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex min-w-0 items-start gap-2">
                                        <span className="line-clamp-2 min-w-0 break-words text-sm font-bold leading-5 text-slate-900">
                                            {objNotification.title}
                                        </span>
                                        {!objNotification.is_read ? (
                                            <span
                                                aria-label="Unread"
                                                className="size-2 shrink-0 rounded-full bg-[#ff8a1f]"
                                            />
                                        ) : null}
                                    </span>
                                    <span className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
                                        {objNotification.message}
                                    </span>
                                    <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-bold">
                                        {objNotification.actor_name ? (
                                            <span className="text-slate-500">
                                                {objNotification.actor_name}
                                                {objNotification.actor_role
                                                    ? ` · ${objNotification.actor_role}`
                                                    : ''}
                                            </span>
                                        ) : null}
                                        {objNotification.program ? (
                                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[#0f53b7]">
                                                {objNotification.program}
                                            </span>
                                        ) : null}
                                        <span className="text-slate-400">
                                            {_relativeTime(objNotification.created_at)}
                                        </span>
                                    </span>
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {arrNotifications.length > 0 ? (
                <div className="flex items-center justify-end border-t border-slate-200 px-4 py-3">
                    <button
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
                        onClick={() => void _markAllRead()}
                        type="button"
                    >
                        <CheckCheck className="size-3.5" /> Mark all read
                    </button>
                </div>
            ) : null}
        </aside>
    ); // end return
} /* end NotificationPanel */

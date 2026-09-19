/**
 * System: DPRMS
 * Purpose: Render notification history for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Bell,
    CheckCheck,
    CircleDollarSign,
    ClipboardCheck,
    FileText,
    PackageSearch,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import
{
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    markNotificationUnread,
    subscribeToNotificationChanges,
    type AppNotification,
} from '../../services/notification_store';

/** Icon for. */
function _iconFor(strCategory: string)
{
    if (strCategory === 'FINANCE')
    {
        return CircleDollarSign;
    }
    if (strCategory === 'EQUIPMENT')
    {
        return PackageSearch;
    }
    if (strCategory === 'CHECKLIST')
    {
        return ClipboardCheck;
    }
    if (strCategory === 'PROPOSAL')
    {
        return FileText;
    }
    return Bell;
}

/** Notification date. */
function _notificationDate(strValue: string)
{
    return new Date(strValue).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Render notification history and its available actions. */
export function NotificationHistory()
{
    const _navigate = useNavigate();
    const [arrNotifications, setArrNotifications] = useState<AppNotification[]>([]);
    const [blnLoading, setBlnLoading] = useState(true);

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
        } /* end NotificationHistory */,
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
            if (objNotification.action_url)
            {
                _navigate(objNotification.action_url);
            }
        } catch (errOperation)
        {
            reportError(errOperation, 'NotificationHistory: open notification failed.');
            throw errOperation;
        }
    }

    /** Toggle unread. */
    async function _toggleUnread(objNotification: AppNotification)
    {
        try
        {
            if (objNotification.is_read)
            {
                await markNotificationUnread(objNotification.id);
            } else
            {
                await markNotificationRead(objNotification.id);
            }
            setArrNotifications((arrItems) =>
                arrItems.map((objItem) =>
                    objItem.id === objNotification.id
                        ? { ...objItem, is_read: !objItem.is_read }
                        : objItem,
                ),
            );
        } catch (errOperation)
        {
            reportError(errOperation, 'NotificationHistory: toggle unread failed.');
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
            reportError(errOperation, 'NotificationHistory: mark all read failed.');
            throw errOperation;
        }
    }

    const intUnreadCount = arrNotifications.filter((objItem) => !objItem.is_read).length;

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                    <Bell className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-black text-slate-900">Notifications</h2>
                    <p className="text-xs text-slate-500">{intUnreadCount} unread</p>
                </div>
                {intUnreadCount > 0 ? (
                    <button
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
                        onClick={() => void _markAllRead()}
                        type="button"
                    >
                        <CheckCheck className="size-4" /> Mark all read
                    </button>
                ) : null}
            </header>

            {blnLoading ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">Loading...</p>
            ) : null}
            {!blnLoading && arrNotifications.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                    No notifications yet
                </p>
            ) : null}
            {!blnLoading && arrNotifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                    {arrNotifications.map((objNotification) =>
                    {
                        const Icon = _iconFor(objNotification.category);
                        return (
                            <article
                                className={objNotification.is_read ? 'bg-white' : 'bg-blue-50/40'}
                                key={objNotification.id}
                            >
                                <div className="flex items-start gap-3 px-5 py-4">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#0f53b7]">
                                        <Icon className="size-4" />
                                    </span>
                                    <button
                                        className="min-w-0 flex-1 text-left"
                                        onClick={() => void _openNotification(objNotification)}
                                        type="button"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">
                                                {objNotification.title}
                                            </span>
                                            {!objNotification.is_read ? (
                                                <span className="size-2 rounded-full bg-[#ff8a1f]" />
                                            ) : null}
                                        </span>
                                        <span className="mt-1 block text-sm leading-6 text-slate-600">
                                            {objNotification.message}
                                        </span>
                                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                            {objNotification.actor_name ? (
                                                <span>
                                                    {objNotification.actor_name}
                                                    {objNotification.actor_role
                                                        ? ` · ${objNotification.actor_role}`
                                                        : ''}
                                                </span>
                                            ) : null}
                                            {objNotification.program ? (
                                                <span className="rounded bg-blue-50 px-1.5 py-0.5 font-bold text-[#0f53b7]">
                                                    {objNotification.program}
                                                </span>
                                            ) : null}
                                            <span>
                                                {_notificationDate(objNotification.created_at)}
                                            </span>
                                        </span>
                                    </button>
                                    <button
                                        className="shrink-0 text-xs font-bold text-slate-500 hover:text-[#0f53b7]"
                                        onClick={() => void _toggleUnread(objNotification)}
                                        type="button"
                                    >
                                        Mark {objNotification.is_read ? 'unread' : 'read'}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : null}
        </section>
    ); // end return
} /* end NotificationHistory */

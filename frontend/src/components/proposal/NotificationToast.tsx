/**
 * System: DPRMS
 * Purpose: Render notification toast for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect } from 'react';

import type { ProposalNotification } from '../../types/proposal';
import { cn } from '../../utils/cn';

interface NotificationToastProps
{
    objNotification: ProposalNotification | null;
    onDismiss: () => void;
}

/** Render notification toast and its available actions. */
export function NotificationToast({ objNotification, onDismiss }: NotificationToastProps)
{
    useEffect(() =>
    {
        if (!objNotification)
        {
            return;
        }

        const intTimeout = window.setTimeout(onDismiss, 5000);
        return () => window.clearTimeout(intTimeout);
    }, [objNotification, onDismiss]);

    if (!objNotification)
    {
        return null;
    }

    const blnIsSuccess = objNotification.type === 'success';
    const Icon = blnIsSuccess ? CircleCheck : CircleAlert;

    return (
        <div
            aria-atomic="true"
            className={cn(
                'fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-lg border bg-white p-4 shadow-xl sm:left-auto sm:right-5 sm:mx-0',
                blnIsSuccess ? 'border-emerald-300' : 'border-red-300',
            )}
            role={blnIsSuccess ? 'status' : 'alert'}
        >
            <Icon
                className={cn(
                    'mt-0.5 size-5 shrink-0',
                    blnIsSuccess ? 'text-emerald-600' : 'text-red-600',
                )}
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">{objNotification.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{objNotification.message}</p>
            </div>
            <button
                aria-label="Dismiss notification"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={onDismiss}
                type="button"
            >
                <X className="size-4" />
            </button>
        </div>
    ); // end return
} /* end NotificationToast */

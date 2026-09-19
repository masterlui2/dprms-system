/**
 * System: DPRMS
 * Purpose: Render modal shell for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalShellProps
{
    children: ReactNode;
    txtDescription?: string;
    objFooter?: ReactNode;
    onClose: () => void;
    title: string;
    strWidth?: 'md' | 'lg' | 'xl';
}

const WIDTHS = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
};

/** Render modal shell and its available actions. */
export function ModalShell({
    children: objChildren,
    txtDescription,
    objFooter,
    onClose,
    title: strTitle,
    strWidth = 'lg',
}: ModalShellProps)
{
    const objCloseRef = useRef<HTMLButtonElement>(null);

    useEffect(() =>
    {
        const objPrevious = document.activeElement as HTMLElement | null;
        const strOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        objCloseRef.current?.focus();

        /** Handle key down. */
        function _handleKeyDown(objEvent: KeyboardEvent)
        {
            if (objEvent.key === 'Escape')
            {
                onClose();
            }
        }

        document.addEventListener('keydown', _handleKeyDown);
        return () =>
        {
            document.removeEventListener('keydown', _handleKeyDown);
            document.body.style.overflow = strOverflow;
            objPrevious?.focus();
        };
    }, [onClose]);

    return (
        <div
            aria-labelledby="admin-modal-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
            role="dialog"
        >
            <div
                className={`flex max-h-[94vh] w-full ${WIDTHS[strWidth]} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
            >
                <header className="flex items-start gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-black text-[#073b82]" id="admin-modal-title">
                            {strTitle}
                        </h2>
                        {txtDescription ? (
                            <p className="mt-1 text-sm text-slate-500">{txtDescription}</p>
                        ) : null}
                    </div>
                    <button
                        aria-label="Close modal"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        onClick={onClose}
                        ref={objCloseRef}
                        type="button"
                    >
                        <X className="size-5" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{objChildren}</div>
                {objFooter ? (
                    <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                        {objFooter}
                    </footer>
                ) : null}
            </div>
        </div>
    ); // end return
} /* end ModalShell */

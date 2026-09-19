/**
 * System: DPRMS
 * Purpose: Render confirmation dialog for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Send, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '../ui/Button';

interface ConfirmationDialogProps
{
    blnIsOpen: boolean;
    blnIsSubmitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/** Render confirmation dialog and its available actions. */
export function ConfirmationDialog({
    blnIsOpen,
    blnIsSubmitting,
    onCancel,
    onConfirm,
}: ConfirmationDialogProps)
{
    const objConfirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(
        () =>
        {
            if (!blnIsOpen)
            {
                return;
            }

            const objPreviousActiveElement = document.activeElement as HTMLElement | null;
            objConfirmButtonRef.current?.focus();

            /** Handle key down. */
            function _handleKeyDown(objEvent: KeyboardEvent)
            {
                if (objEvent.key === 'Escape' && !blnIsSubmitting)
                {
                    onCancel();
                }
            }

            document.addEventListener('keydown', _handleKeyDown);

            return () =>
            {
                document.removeEventListener('keydown', _handleKeyDown);
                objPreviousActiveElement?.focus();
            };
        } /* end ConfirmationDialog */,
        [blnIsOpen, blnIsSubmitting, onCancel],
    );

    if (!blnIsOpen)
    {
        return null;
    }

    return (
        <div
            aria-labelledby="confirmation-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
            role="dialog"
        >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-[#073b82]" id="confirmation-title">
                            Submit this proposal?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Your proposal will enter the DOST review queue. Make sure all
                            information and documents are correct before continuing.
                        </p>
                    </div>
                    <button
                        aria-label="Close confirmation"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        disabled={blnIsSubmitting}
                        onClick={onCancel}
                        type="button"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        className="h-11"
                        disabled={blnIsSubmitting}
                        onClick={onCancel}
                        type="button"
                        variant="outline"
                    >
                        Review Again
                    </Button>
                    <Button
                        className="h-11"
                        disabled={blnIsSubmitting}
                        onClick={onConfirm}
                        ref={objConfirmButtonRef}
                        type="button"
                    >
                        <Send className="size-4" />
                        {blnIsSubmitting ? 'Submitting...' : 'Confirm Submission'}
                    </Button>
                </div>
            </div>
        </div>
    ); // end return
} /* end ConfirmationDialog */

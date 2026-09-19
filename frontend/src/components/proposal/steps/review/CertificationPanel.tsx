/**
 * System: DPRMS
 * Purpose: Render certification panel for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
interface CertificationPanelProps
{
    blnCertified: boolean;
    strError?: string;
    onCertifiedChange: (blnCertified: boolean) => void;
}

/** Render certification panel and its available actions. */
export function CertificationPanel({
    blnCertified,
    strError,
    onCertifiedChange,
}: CertificationPanelProps)
{
    return (
        <div>
            <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-[#0f53b7]"
                htmlFor="certified"
            >
                <input
                    checked={blnCertified}
                    className="mt-1 size-4 shrink-0 accent-[#0f53b7]"
                    id="certified"
                    onChange={(objEvent) => onCertifiedChange(objEvent.target.checked)}
                    type="checkbox"
                />
                <span className="text-sm leading-6 text-slate-600">
                    I reviewed this submission and certify that the information and uploaded
                    documents are true and complete.
                    <span aria-hidden="true" className="ml-1 font-bold text-red-600">
                        *
                    </span>
                </span>
            </label>
            {strError ? (
                <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
                    {strError}
                </p>
            ) : null}
        </div>
    ); // end return
} /* end CertificationPanel */

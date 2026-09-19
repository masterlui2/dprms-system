/**
 * System: DPRMS
 * Purpose: Render msme classification field for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Building2, Info } from 'lucide-react';

import { cn } from '../../utils/cn';
import { classifyMsme, formatPhilippinePeso } from '../../utils/msme_classification';

interface MsmeClassificationFieldProps
{
    strTotalBusinessAssets: string;
}

/** Render msme classification field and its available actions. */
export function MsmeClassificationField({ strTotalBusinessAssets }: MsmeClassificationFieldProps)
{
    const strClassification = classifyMsme(strTotalBusinessAssets);
    const blnIsOutsideMsmeRange = strClassification === 'Outside MSME Range';

    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#0f53b7] shadow-sm">
                    <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">MSME Classification</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <strong
                            className={cn(
                                'text-base',
                                blnIsOutsideMsmeRange ? 'text-amber-700' : 'text-[#073b82]',
                            )}
                        >
                            {strClassification ?? 'Enter total business assets to classify'}
                        </strong>
                        {strClassification ? (
                            <span className="text-xs font-semibold text-slate-500">
                                ({formatPhilippinePeso(strTotalBusinessAssets)} in assets)
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                        <Info className="mt-0.5 size-3.5 shrink-0" />
                        Classification follows RA 9501 using total assets excluding the land where
                        the business office, plant, and equipment are located.
                    </p>
                </div>
            </div>
        </div>
    ); // end return
} /* end MsmeClassificationField */

/**
 * System: DPRMS
 * Purpose: Render proposal header for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ArrowLeft, CircleHelp } from 'lucide-react';
import { Link } from 'react-router-dom';

import logoImage from '../../assets/logo2.png';
import { getMockUser } from '../../lib/mock_auth';
import type { ProposalType } from '../../types/proposal';

/** Render proposal header and its available actions. */
export function ProposalHeader({ strProgram }: { strProgram: Exclude<ProposalType, ''>; })
{
    const objUser = getMockUser();
    const strHomeProgram = objUser?.program ?? strProgram;
    const strProgramHomeUrl = `/programs/${strHomeProgram.toLowerCase()}`;

    return (
        <header className="border-b border-blue-950 bg-[#073b82] text-white">
            <div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-5 px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="absolute left-1/2 top-1/2 h-[76px] w-[76px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                            src={logoImage}
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black sm:text-base">
                            {strProgram === 'GIA'
                                ? 'GIA Project Portal'
                                : 'SETUP Beneficiary Portal'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/70">
                            {strProgram === 'GIA'
                                ? 'Submit your Grants-in-Aid project proposal'
                                : 'Submit your SETUP technology assistance request'}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <a
                        className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white sm:inline-flex"
                        href="#proposal-support"
                    >
                        <CircleHelp className="size-4" />
                        Need help?
                    </a>
                    <Link
                        aria-label={`Back to ${strHomeProgram} home`}
                        className="inline-flex size-10 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                        title={`Back to ${strHomeProgram} home`}
                        to={strProgramHomeUrl}
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                </div>
            </div>
        </header>
    ); // end return
} /* end ProposalHeader */

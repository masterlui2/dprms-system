/**
 * System: DPRMS
 * Purpose: Render proposal section heading for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
interface ProposalSectionHeadingProps
{
    txtDescription: string;
    blnDivided?: boolean;
    title: string;
}

/** Render proposal section heading and its available actions. */
export function ProposalSectionHeading({
    txtDescription,
    blnDivided = true,
    title: strTitle,
}: ProposalSectionHeadingProps)
{
    return (
        <div className={blnDivided ? 'border-b border-slate-200 pb-5' : ''}>
            <h2 className="text-xl font-black text-[#073b82] sm:text-2xl">{strTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{txtDescription}</p>
        </div>
    );
}

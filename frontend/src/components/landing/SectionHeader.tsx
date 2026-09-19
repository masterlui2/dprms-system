/**
 * System: DPRMS
 * Purpose: Render section header for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
type SectionHeaderProps = {
    strEyebrow: string;
    title: string;
    txtDescription?: string;
    strTheme?: 'light' | 'dark';
};

/** Render section header and its available actions. */
export function SectionHeader({
    txtDescription,
    strEyebrow,
    strTheme = 'light',
    title: strTitle,
}: SectionHeaderProps)
{
    const blnIsDark = strTheme === 'dark';

    return (
        <div className="mx-auto max-w-3xl text-center">
            <p
                className={`text-sm font-bold uppercase ${blnIsDark ? 'text-blue-100' : 'text-[#0f53b7]'}`}
            >
                {strEyebrow}
            </p>
            <h2
                className={`mt-3 text-3xl font-black md:text-4xl ${blnIsDark ? 'text-white' : 'text-slate-950'}`}
            >
                {strTitle}
            </h2>
            {txtDescription ? (
                <p
                    className={`mt-4 text-base leading-7 md:text-lg ${blnIsDark ? 'text-blue-100' : 'text-slate-600'}`}
                >
                    {txtDescription}
                </p>
            ) : null}
        </div>
    );
}

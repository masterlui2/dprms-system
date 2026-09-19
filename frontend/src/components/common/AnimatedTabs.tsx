/**
 * System: DPRMS
 * Purpose: Render animated tabs for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { motion } from 'framer-motion';
import type { ComponentType } from 'react';
import { cn } from '../../utils/cn';

export interface AnimatedTabItem
{
    id: string;
    label: string;
    icon?: ComponentType<{ className?: string; }>;
    count?: number | string;
}

interface AnimatedTabsProps
{
    arrTabs: AnimatedTabItem[];
    strActiveTab: string;
    onChange: (strId: string) => void;
    strLayoutId?: string;
    className?: string;
    strPillColor?: string;
    strVariant?: 'pill' | 'underline';
}

/** Render animated tabs and its available actions. */
export function AnimatedTabs({
    arrTabs,
    strActiveTab,
    onChange,
    strLayoutId = 'animated-tab',
    className: strClassName,
    strPillColor = 'bg-[#0f53b7]',
    strVariant = 'pill',
}: AnimatedTabsProps)
{
    if (strVariant === 'underline')
    {
        return (
            <div
                className={cn(
                    'relative flex items-center gap-5 overflow-x-auto border-b border-[#B5BFCD]/40 pb-px scrollbar-none',
                    strClassName,
                )}
            >
                {arrTabs.map(
                    (objTab) =>
                    {
                        const blnIsActive = strActiveTab === objTab.id;
                        const Icon = objTab.icon;

                        return (
                            <button
                                key={objTab.id}
                                type="button"
                                onClick={() => onChange(objTab.id)}
                                className={cn(
                                    'relative flex items-center gap-2 pb-2.5 pt-1 text-xs font-bold transition-colors duration-200 outline-none shrink-0 cursor-pointer',
                                    blnIsActive
                                        ? 'text-[#0f53b7]'
                                        : 'text-slate-500 hover:text-slate-900',
                                )}
                            >
                                {Icon && <Icon className="size-3.5 shrink-0" />}
                                <span>{objTab.label}</span>
                                {objTab.count !== undefined && (
                                    <span
                                        className={cn(
                                            'rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums transition-colors',
                                            blnIsActive
                                                ? 'bg-blue-100/80 text-[#0f53b7]'
                                                : 'bg-slate-100 text-slate-600',
                                        )}
                                    >
                                        {objTab.count}
                                    </span>
                                )}
                                {blnIsActive && (
                                    <motion.div
                                        layoutId={strLayoutId}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 450,
                                            damping: 35,
                                        }}
                                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#0f53b7]"
                                    />
                                )}
                            </button>
                        ); // end return
                    } /* end AnimatedTabs */,
                )}
            </div>
        ); // end return
    } /* end if */

    return (
        <div
            className={cn(
                'relative inline-flex items-center gap-1 rounded-full bg-[#EAF1F8] p-1 border border-[#C5D5E7]/80 shadow-xs',
                strClassName,
            )}
        >
            {arrTabs.map(
                (objTab) =>
                {
                    const blnIsActive = strActiveTab === objTab.id;
                    const Icon = objTab.icon;

                    return (
                        <button
                            key={objTab.id}
                            type="button"
                            onClick={() => onChange(objTab.id)}
                            className={cn(
                                'relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-colors duration-200 outline-none cursor-pointer',
                                blnIsActive ? 'text-white' : 'text-slate-600 hover:text-[#0f53b7]',
                            )}
                        >
                            {blnIsActive && (
                                <motion.div
                                    layoutId={strLayoutId}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 450,
                                        damping: 35,
                                    }}
                                    className={cn(
                                        'absolute inset-0 rounded-full shadow-sm',
                                        strPillColor,
                                    )}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            {Icon && <Icon className="size-3.5 shrink-0" />}
                            <span>{objTab.label}</span>
                            {objTab.count !== undefined && (
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums transition-colors',
                                        blnIsActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white text-[#285497] border border-[#B5BFCD]/40 shadow-xs',
                                    )}
                                >
                                    {objTab.count}
                                </span>
                            )}
                        </button>
                    ); // end return
                } /* end AnimatedTabs */,
            )}
        </div>
    ); // end return
} /* end AnimatedTabs */

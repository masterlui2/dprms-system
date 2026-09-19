/**
 * System: DPRMS
 * Purpose: Render form fields for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type {
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from 'react';

import type { SelectOption } from '../../data/proposal';
import { cn } from '../../utils/cn';

interface FieldShellProps
{
    children: ReactNode;
    strError?: string;
    strHelperText?: string;
    id: string;
    strLabel: string;
    required?: boolean;
}

const CONTROL_CLASSES =
    'min-h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

/** Render field shell and its available actions. */
function FieldShell({
    children: objChildren,
    strError,
    strHelperText,
    id: strId,
    strLabel,
    required: blnRequired = false,
}: FieldShellProps)
{
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800" htmlFor={strId}>
                {strLabel}
                {blnRequired ? (
                    <>
                        <span aria-hidden="true" className="ml-1 text-red-600">
                            *
                        </span>
                        <span className="sr-only"> required</span>
                    </>
                ) : null}
            </label>
            {objChildren}
            {strError ? (
                <p
                    className="text-xs font-semibold text-red-600"
                    id={`${strId}-error`}
                    role="alert"
                >
                    {strError}
                </p>
            ) : strHelperText ? (
                <p className="text-xs leading-5 text-slate-500" id={`${strId}-helper`}>
                    {strHelperText}
                </p>
            ) : null}
        </div>
    );
} /* end FieldShell */

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'>
{
    strError?: string;
    strHelperText?: string;
    id: string;
    strLabel: string;
    required?: boolean;
}

/** Render input field and its available actions. */
export function InputField({
    className: strClassName,
    strError,
    strHelperText,
    id: strId,
    strLabel,
    required: blnRequired,
    ...objInputProps
}: InputFieldProps)
{
    const txtDescriptionId = strError
        ? `${strId}-error`
        : strHelperText
            ? `${strId}-helper`
            : undefined;

    return (
        <FieldShell
            strError={strError}
            strHelperText={strHelperText}
            id={strId}
            strLabel={strLabel}
            required={blnRequired}
        >
            <input
                aria-describedby={txtDescriptionId}
                aria-invalid={Boolean(strError)}
                className={cn(
                    CONTROL_CLASSES,
                    strError && 'border-red-500 focus:border-red-600 focus:ring-red-100',
                    strClassName,
                )}
                id={strId}
                required={blnRequired}
                {...objInputProps}
            />
        </FieldShell>
    );
}

interface SelectFieldProps extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'id' | 'required'
>
{
    strError?: string;
    strHelperText?: string;
    id: string;
    strLabel: string;
    arrOptions: SelectOption[];
    placeholder: string;
    required?: boolean;
}

/** Render select field and its available actions. */
export function SelectField({
    className: strClassName,
    strError,
    strHelperText,
    id: strId,
    strLabel,
    arrOptions,
    placeholder: strPlaceholder,
    required: blnRequired,
    ...objSelectProps
}: SelectFieldProps)
{
    const txtDescriptionId = strError
        ? `${strId}-error`
        : strHelperText
            ? `${strId}-helper`
            : undefined;

    return (
        <FieldShell
            strError={strError}
            strHelperText={strHelperText}
            id={strId}
            strLabel={strLabel}
            required={blnRequired}
        >
            <select
                aria-describedby={txtDescriptionId}
                aria-invalid={Boolean(strError)}
                className={cn(
                    CONTROL_CLASSES,
                    strError && 'border-red-500 focus:border-red-600 focus:ring-red-100',
                    strClassName,
                )}
                id={strId}
                required={blnRequired}
                {...objSelectProps}
            >
                <option value="">{strPlaceholder}</option>
                {arrOptions.map((objOption) => (
                    <option key={objOption.value} value={objOption.value}>
                        {objOption.label}
                    </option>
                ))}
            </select>
        </FieldShell>
    );
} /* end SelectField */

interface TextAreaFieldProps extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'id' | 'required'
>
{
    strError?: string;
    strHelperText?: string;
    id: string;
    strLabel: string;
    required?: boolean;
}

/** Render text area field and its available actions. */
export function TextAreaField({
    className: strClassName,
    strError,
    strHelperText,
    id: strId,
    strLabel,
    required: blnRequired,
    ...objTextAreaProps
}: TextAreaFieldProps)
{
    const txtDescriptionId = strError
        ? `${strId}-error`
        : strHelperText
            ? `${strId}-helper`
            : undefined;

    return (
        <FieldShell
            strError={strError}
            strHelperText={strHelperText}
            id={strId}
            strLabel={strLabel}
            required={blnRequired}
        >
            <textarea
                aria-describedby={txtDescriptionId}
                aria-invalid={Boolean(strError)}
                className={cn(
                    CONTROL_CLASSES,
                    'min-h-28 resize-y',
                    strError && 'border-red-500 focus:border-red-600 focus:ring-red-100',
                    strClassName,
                )}
                id={strId}
                required={blnRequired}
                {...objTextAreaProps}
            />
        </FieldShell>
    );
} /* end TextAreaField */

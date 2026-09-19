/**
 * System: DPRMS
 * Purpose: Render setup proposal form for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { LucideIcon } from 'lucide-react';
import { Building2, Target } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { EMPTY_SETUP_PROPOSAL, SETUP_INDUSTRY_CATEGORIES } from '../../data/setup_proposal';
import { getMockUser } from '../../lib/mock_auth';
import { getSetupDraft, saveSetupDraft } from '../../services/setup_proposal_store';
import type {
    SetupProposalData,
    SetupProposalErrors,
    SetupProposalField,
} from '../../types/setup_proposal';
import { cn } from '../../utils/cn';

const SECTION_CLASS =
    'scroll-mt-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm';
const INPUT_CLASS =
    'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100';

const REQUIRED_FIELDS: Array<keyof SetupProposalData> = [
    'projectTitle',
    'generalObjective',
    'specificObjectives',
    'projectBackground',
    'businessName',
    'businessAddress',
    'contactPerson',
    'contactNumber',
    'emailAddress',
    'yearEstablished',
    'organizationType',
    'businessSize',
    'numberOfEmployees',
    'businessIndustry',
    'productsServices',
    'enterpriseBackground',
];

const FIELD_LABELS: Partial<Record<keyof SetupProposalData, string>> = {
    projectTitle: 'Project title',
    generalObjective: 'General objective',
    specificObjectives: 'Specific objectives',
    projectBackground: 'Project background',
    businessName: 'Business name',
    businessAddress: 'Business address',
    contactPerson: 'Contact person',
    contactNumber: 'Contact number',
    emailAddress: 'Email address',
    yearEstablished: 'Year established',
    organizationType: 'Organization type',
    businessSize: 'Business size',
    numberOfEmployees: 'Number of employees',
    businessIndustry: 'Business industry',
    productsServices: 'Products / services',
    enterpriseBackground: 'Enterprise background',
};

/** Validate. */
function _validate(objData: SetupProposalData)
{
    const objErrors: SetupProposalErrors = {};
    for (const strField of REQUIRED_FIELDS)
    {
        const strValue = objData[strField];
        if (Array.isArray(strValue) ? strValue.length === 0 : !String(strValue).trim())
        {
            objErrors[strField] = `${FIELD_LABELS[strField] ?? 'This field'} is required.`;
        }
    }
    if (objData.emailAddress && !/^\S+@\S+\.\S+$/.test(objData.emailAddress))
    {
        objErrors.emailAddress = 'Enter a valid email address.';
    }
    if (objData.contactNumber && !/^[+0-9][0-9\s()-]{7,18}$/.test(objData.contactNumber))
    {
        objErrors.contactNumber = 'Enter a valid contact number.';
    }
    const intYear = Number(objData.yearEstablished);
    if (objData.yearEstablished && (intYear < 1800 || intYear > new Date().getFullYear()))
    {
        objErrors.yearEstablished = 'Enter a valid year.';
    }
    if (objData.numberOfEmployees && Number(objData.numberOfEmployees) < 1)
    {
        objErrors.numberOfEmployees = 'Enter at least 1 employee.';
    }
    return objErrors;
} /* end _validate */

/** Render section and its available actions. */
function Section({
    children: objChildren,
    icon: Icon,
    id: strId,
    title: strTitle,
}: {
    children: React.ReactNode;
    txtDescription: string;
    icon: LucideIcon;
    id: string;
    title: string;
})
{
    return (
        <div className={SECTION_CLASS} id={strId}>
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
                    <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-base font-black text-[#073b82] sm:text-lg">
                        {strTitle}
                    </span>
                </span>
            </div>
            <div className="border-t border-slate-100 px-5 py-6 sm:px-6">{objChildren}</div>
        </div>
    );
}

/** Render official row and its available actions. */
function OfficialRow({
    children: objChildren,
    strError,
    strHelp,
    id: strId,
    strLabel,
}: {
    children: React.ReactNode;
    strError?: string;
    strHelp?: string;
    id: string;
    strLabel: string;
    required?: boolean;
})
{
    return (
        <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[190px_minmax(0,1fr)]">
            <label
                className="bg-slate-50 px-3 py-3 text-sm font-bold leading-5 text-slate-800 sm:border-r sm:border-slate-200"
                htmlFor={strId}
            >
                {strLabel}
                {strError ? <span className="ml-1 text-red-600 font-bold">*</span> : null}
                {strHelp ? (
                    <span className="mt-1 block text-xs font-medium leading-4 text-slate-500">
                        {strHelp}
                    </span>
                ) : null}
            </label>
            <div className="px-3 py-3">
                {objChildren}
                {strError ? (
                    <p
                        className="mt-1.5 text-xs font-semibold text-red-600"
                        id={`${strId}-error`}
                        role="alert"
                    >
                        {strError}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

interface SetupProposalFormProps
{
    onDraftChange?: (objDraft: SetupProposalData) => void;
}

/**
 * Imperative handle exposed to the parent page. The parent drives the
 * actual submit-to-backend flow (proposal creation + document uploads, in
 * that order) — this component's job is only to own its own field state
 * and validation. `validate()` runs the same checks the form used to run
 * on its own onSubmit, surfaces errors/scrolls exactly as before, and
 * returns the current data if valid or `null` if not (caller should stop).
 */
export interface SetupProposalFormHandle
{
    validate: () => SetupProposalData | null;
}

export const SetupProposalForm = forwardRef<SetupProposalFormHandle, SetupProposalFormProps>(
    function SetupProposalForm({ onDraftChange }, ref)
    {
        const objUser = getMockUser();
        const [objData, setObjData] = useState<SetupProposalData>(() =>
        {
            const objDraft = getSetupDraft();
            return (
                objDraft ?? {
                    ...EMPTY_SETUP_PROPOSAL,
                    emailAddress: objUser?.email ?? '',
                    contactPerson: objUser?.name ?? '',
                }
            );
        });
        const [objErrors, setObjErrors] = useState<SetupProposalErrors>({});
        const objSubmitted = useRef(false);
        // Always holds the latest keystroke, even between debounce ticks — used
        // so an unmount mid-typing doesn't lose anything, without forcing a save
        // on every single keystroke the way the old cleanup did.
        const objLatestData = useRef(objData);
        objLatestData.current = objData;

        // Push the draft up to the parent (and persist it) only after typing
        // pauses, instead of on every keystroke. Doing this on every keystroke
        // was forcing the whole parent page (including the full documents list)
        // to re-render per character typed, which is what was making the form
        // feel like it hangs.
        useEffect(() =>
        {
            const intTimer = window.setTimeout(() =>
            {
                onDraftChange?.(objData);
                saveSetupDraft(objData);
            }, 400);
            return () =>
            {
                window.clearTimeout(intTimer);
            };
        }, [objData, onDraftChange]);

        // Save whatever the user last typed if they navigate away before the
        // debounce above has a chance to fire. Runs once, only on unmount.
        useEffect(() =>
        {
            return () =>
            {
                if (!objSubmitted.current)
                {
                    saveSetupDraft(objLatestData.current);
                }
            };
        }, []);

        /** Update. */
        function _update<K extends SetupProposalField>(
            udtField: K,
            objValue: SetupProposalData[K],
        )
        {
            setObjData((objCurrent) => ({ ...objCurrent, [udtField]: objValue }));
            setObjErrors((objCurrent) => ({ ...objCurrent, [udtField]: undefined }));
        }

        /** Input. */
        function _input(
            strField: SetupProposalField,
            objOptions?: {
                type?: string;
                placeholder?: string;
                inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
            },
        )
        {
            const strValue = objData[strField] as string;
            return (
                <input
                    aria-describedby={objErrors[strField] ? `${strField}-error` : undefined}
                    aria-invalid={Boolean(objErrors[strField])}
                    className={cn(
                        INPUT_CLASS,
                        objErrors[strField] &&
                        'border-red-500 focus:border-red-600 focus:ring-red-100',
                    )}
                    id={strField}
                    inputMode={objOptions?.inputMode}
                    onChange={(objEvent) =>
                        _update(
                            strField,
                            objEvent.target.value as SetupProposalData[typeof strField],
                        )
                    }
                    placeholder={objOptions?.placeholder}
                    type={objOptions?.type ?? 'text'}
                    value={strValue}
                />
            );
        }

        /** Textarea. */
        function _textarea(strField: SetupProposalField, strPlaceholder: string)
        {
            return (
                <textarea
                    aria-describedby={objErrors[strField] ? `${strField}-error` : undefined}
                    aria-invalid={Boolean(objErrors[strField])}
                    className={cn(
                        INPUT_CLASS,
                        'min-h-28 resize-y',
                        objErrors[strField] &&
                        'border-red-500 focus:border-red-600 focus:ring-red-100',
                    )}
                    id={strField}
                    onChange={(objEvent) =>
                        _update(
                            strField,
                            objEvent.target.value as SetupProposalData[typeof strField],
                        )
                    }
                    placeholder={strPlaceholder}
                    value={objData[strField] as string}
                />
            );
        }

        useImperativeHandle(
            ref,
            () => ({
                validate: () =>
                {
                    const objNextErrors = _validate(objData);
                    setObjErrors(objNextErrors);
                    const strFirstError = REQUIRED_FIELDS.find(
                        (strField) => objNextErrors[strField],
                    );
                    if (strFirstError)
                    {
                        window.setTimeout(
                            () =>
                                document
                                    .getElementById(strFirstError)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                            0,
                        );
                        return null;
                    }
                    // Marks the draft as "handed off" so the unmount-save effect below
                    // doesn't overwrite what the parent is about to submit with a stale
                    // localStorage draft on the reload that follows a successful submit.
                    objSubmitted.current = true;
                    return objData;
                },
            }),
            [objData],
        );

        /** Radio group. */
        const _radioGroup = (
            strField: 'organizationType' | 'businessSize',
            arrValues: string[],
        ) => (
            <div className="grid gap-2 sm:grid-cols-2" id={strField}>
                {arrValues.map((strValue) => (
                    <label
                        className={cn(
                            'flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-sm font-semibold transition',
                            objData[strField] === strValue
                                ? 'border-[#0f53b7] bg-blue-50 text-[#073b82] ring-1 ring-[#0f53b7]'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300',
                        )}
                        key={strValue}
                    >
                        <input
                            checked={objData[strField] === strValue}
                            className="size-4 accent-[#0f53b7]"
                            name={strField}
                            onChange={() => _update(strField, strValue as never)}
                            type="radio"
                        />
                        {strValue}
                    </label>
                ))}
            </div>
        );

        return (
            <div className="space-y-5">
                {Object.keys(objErrors).length > 0 ? (
                    <div
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                        role="alert"
                    >
                        Please complete the highlighted fields before submitting.
                    </div>
                ) : null}

                <Section
                    txtDescription="Define the goal and background of the proposed assistance."
                    icon={Target}
                    id="project-information"
                    title="1. Project Information"
                >
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <OfficialRow
                            strError={objErrors.projectTitle}
                            strHelp="Must reflect the goal of the project."
                            id="projectTitle"
                            strLabel="Project Title"
                        >
                            {_input('projectTitle', {
                                placeholder: 'e.g., Modernization of Cacao Processing Operations',
                            })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.generalObjective}
                            id="generalObjective"
                            strLabel="General Objective"
                        >
                            {_textarea(
                                'generalObjective',
                                'State the overall goal of the project.',
                            )}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.specificObjectives}
                            id="specificObjectives"
                            strLabel="Specific Objectives"
                        >
                            {_textarea(
                                'specificObjectives',
                                'List measurable objectives, one per line.',
                            )}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.projectBackground}
                            id="projectBackground"
                            strLabel="Project Background"
                        >
                            {_textarea(
                                'projectBackground',
                                'Briefly explain the need for the project and its context.',
                            )}
                        </OfficialRow>
                    </div>
                </Section>

                <Section
                    txtDescription="Basic enterprise and contact details."
                    icon={Building2}
                    id="company-profile"
                    title="2. Company Profile"
                >
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <OfficialRow
                            strError={objErrors.businessName}
                            id="businessName"
                            strLabel="Name of Firm"
                        >
                            {_input('businessName', { placeholder: 'Registered business name' })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.businessAddress}
                            id="businessAddress"
                            strLabel="Address"
                        >
                            {_textarea('businessAddress', 'Complete operating address')}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.contactPerson}
                            id="contactPerson"
                            strLabel="Contact Person"
                        >
                            {_input('contactPerson', { placeholder: 'Full name' })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.contactNumber}
                            id="contactNumber"
                            strLabel="Contact No."
                        >
                            {_input('contactNumber', {
                                placeholder: '+63 9XX XXX XXXX',
                                inputMode: 'tel',
                            })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.emailAddress}
                            id="emailAddress"
                            strLabel="E-mail Address"
                        >
                            {_input('emailAddress', {
                                type: 'email',
                                placeholder: 'name@company.com',
                            })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.yearEstablished}
                            id="yearEstablished"
                            strLabel="Year Established"
                        >
                            {_input('yearEstablished', { type: 'number', placeholder: 'YYYY' })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.organizationType}
                            strHelp="Select one."
                            id="organizationType"
                            strLabel="Type of Organization"
                        >
                            {_radioGroup('organizationType', [
                                'Sole Proprietorship',
                                'Partnership',
                                'Cooperative',
                                'Corporation',
                            ])}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.businessSize}
                            strHelp="Select MSME classification."
                            id="businessSize"
                            strLabel="Business Size"
                        >
                            <div className="grid gap-2 sm:grid-cols-3" id="businessSize">
                                {[
                                    { label: 'Micro', note: 'P3M total asset value or less' },
                                    {
                                        label: 'Small',
                                        note: 'P3,000,001 to P15M total asset value',
                                    },
                                    {
                                        label: 'Medium',
                                        note: 'P15,000,001 to P100M total asset value',
                                    },
                                ].map((objItem) => (
                                    <label
                                        className={cn(
                                            'flex min-h-20 cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-sm font-semibold transition',
                                            objData.businessSize === objItem.label
                                                ? 'border-[#0f53b7] bg-blue-50 text-[#073b82] ring-1 ring-[#0f53b7]'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300',
                                        )}
                                        key={objItem.label}
                                    >
                                        <input
                                            checked={objData.businessSize === objItem.label}
                                            className="mt-0.5 size-4 accent-[#0f53b7]"
                                            name="businessSize"
                                            onChange={() =>
                                                _update(
                                                    'businessSize',
                                                    objItem.label as SetupProposalData['businessSize'],
                                                )
                                            }
                                            type="radio"
                                        />
                                        <span>
                                            <span className="block">{objItem.label}</span>
                                            <span className="mt-1 block text-xs font-medium leading-4 text-slate-500">
                                                {objItem.note}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.numberOfEmployees}
                            id="numberOfEmployees"
                            strLabel="Number of Employees"
                        >
                            {_input('numberOfEmployees', {
                                type: 'number',
                                placeholder: 'Total employees',
                            })}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.businessIndustry}
                            strHelp="Search or choose the closest SETUP category."
                            id="businessIndustry"
                            strLabel="Business Activities"
                        >
                            <input
                                className={cn(
                                    INPUT_CLASS,
                                    objErrors.businessIndustry && 'border-red-500',
                                )}
                                list="setup-industries"
                                id="businessIndustry"
                                onChange={(objEvent) =>
                                    _update('businessIndustry', objEvent.target.value)
                                }
                                placeholder="Search or select an industry"
                                value={objData.businessIndustry}
                            />
                            <datalist id="setup-industries">
                                {SETUP_INDUSTRY_CATEGORIES.map((strCategory) => (
                                    <option key={strCategory} value={strCategory} />
                                ))}
                            </datalist>
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.productsServices}
                            id="productsServices"
                            strLabel="Products / Services"
                        >
                            {_textarea('productsServices', 'Main products or services offered')}
                        </OfficialRow>
                        <OfficialRow
                            strError={objErrors.enterpriseBackground}
                            id="enterpriseBackground"
                            strLabel="Brief Enterprise Background"
                        >
                            {_textarea(
                                'enterpriseBackground',
                                'Brief history, milestones, and present operations',
                            )}
                        </OfficialRow>
                    </div>
                </Section>
            </div>
        ); // end return
    } /* end SetupProposalForm */,
);

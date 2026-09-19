/**
 * System: DPRMS
 * Purpose: Render gia proposal form for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { LucideIcon } from 'lucide-react';
import
{
    Building2,
    Check,
    ChevronDown,
    ClipboardList,
    LoaderCircle,
    Save,
    Target,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import
{
    EMPTY_GIA_PROPOSAL,
    GIA_PROJECT_CATEGORIES,
    GIA_PROJECT_TYPES,
    GIA_PROPONENT_CATEGORIES,
} from '../../data/gia_proposal';
import { getMockUser } from '../../lib/mock_auth';
import { getGiaDraft, saveGiaDraft } from '../../services/gia_proposal_store';
import type {
    GiaProponentCategory,
    GiaProposalData,
    GiaProposalErrors,
    GiaProposalField,
} from '../../types/gia_proposal';
import { cn } from '../../utils/cn';

const INPUT_CLASS =
    'mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100';

const REQUIRED_FIELDS: GiaProposalField[] = [
    'proponentCategory',
    'organizationName',
    'officeAddress',
    'projectLeader',
    'position',
    'contactNumber',
    'emailAddress',
    'projectTitle',
    'projectCategory',
    'projectType',
    'projectSummary',
    'projectRationale',
    'generalObjective',
    'specificObjectives',
    'siteOfImplementation',
    'targetBeneficiaries',
    'methodology',
    'expectedOutputs',
    'sustainabilityPlan',
];

const FIELD_LABELS: Record<GiaProposalField, string> = {
    proponentCategory: 'Proponent category',
    organizationName: 'Organization name',
    officeAddress: 'Office address',
    projectLeader: 'Project leader',
    position: 'Position',
    contactNumber: 'Contact number',
    emailAddress: 'Email address',
    projectTitle: 'Project title',
    projectCategory: 'Project category',
    projectType: 'Project type',
    projectSummary: 'Project summary',
    projectRationale: 'Project rationale',
    generalObjective: 'General objective',
    specificObjectives: 'Specific objectives',
    siteOfImplementation: 'Site of implementation',
    targetBeneficiaries: 'Target beneficiaries',
    methodology: 'Implementation approach',
    expectedOutputs: 'Expected outputs',
    sustainabilityPlan: 'Sustainability plan',
};

/** Validate. */
function _validate(objData: GiaProposalData)
{
    const objErrors: GiaProposalErrors = {};
    for (const strField of REQUIRED_FIELDS)
    {
        if (!String(objData[strField]).trim())
        {
            objErrors[strField] = `${FIELD_LABELS[strField]} is required.`;
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
    return objErrors;
}

/** Render section and its available actions. */
function Section({
    children: objChildren,
    icon: Icon,
    id: strId,
    title: strTitle,
}: {
    children: React.ReactNode;
    icon: LucideIcon;
    id: string;
    title: string;
})
{
    return (
        <details
            className="group scroll-mt-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            id={strId}
            open
        >
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                    <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-base font-black text-[#073b82] sm:text-lg">
                    {strTitle}
                </span>
                <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-100 p-5 sm:p-6">{objChildren}</div>
        </details>
    );
}

/** Render field and its available actions. */
function Field({
    children: objChildren,
    strError,
    strLabel,
    required: blnRequired = true,
}: {
    children: React.ReactNode;
    strError?: string;
    strLabel: string;
    required?: boolean;
})
{
    return (
        <label className="block text-sm font-bold text-slate-700">
            {strLabel}
            {blnRequired ? <span className="ml-1 text-red-600">*</span> : null}
            {objChildren}
            {strError ? (
                <span className="mt-1.5 block text-xs font-semibold text-red-600" role="alert">
                    {strError}
                </span>
            ) : null}
        </label>
    );
}

interface GiaProposalFormProps
{
    onDraftChange?: (objDraft: GiaProposalData) => void;
}

/**
 * Imperative handle exposed to the parent page. Same contract as
 * SetupProposalFormHandle in SetupProposalForm.tsx: the parent
 * (DocumentaryRequirementsPage) drives the actual submit-to-backend flow
 * (proposal creation + document uploads, in that order) — this component's
 * job is only to own its own field state and validation. `validate()` runs
 * the same checks the form used to run on its own onSubmit, surfaces
 * errors/scrolls exactly as before, and returns the current data if valid
 * or `null` if not (caller should stop).
 */
export interface GiaProposalFormHandle
{
    validate: () => GiaProposalData | null;
}

export const GiaProposalForm = forwardRef<GiaProposalFormHandle, GiaProposalFormProps>(
    function GiaProposalForm({ onDraftChange }, ref)
    {
        const objUser = getMockUser();
        const [objData, setObjData] = useState<GiaProposalData>(
            () =>
                getGiaDraft() ?? {
                    ...EMPTY_GIA_PROPOSAL,
                    emailAddress: objUser?.email ?? '',
                    projectLeader: objUser?.name ?? '',
                },
        );
        const [objErrors, setObjErrors] = useState<GiaProposalErrors>({});
        const [strSaveState, setStrSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
        const [dtLastSaved, setDtLastSaved] = useState<Date | null>(null);
        const objFirstRender = useRef(true);
        const objSubmitted = useRef(false);
        // Always holds the latest keystroke, even between debounce ticks — used
        // so an unmount mid-typing doesn't lose anything (same pattern as
        // SetupProposalForm's latestData ref).
        const objLatestData = useRef(objData);
        objLatestData.current = objData;

        useEffect(() =>
        {
            onDraftChange?.(objData);
            if (objFirstRender.current)
            {
                objFirstRender.current = false;
                return;
            }
            setStrSaveState('saving');
            const intTimer = window.setTimeout(() =>
            {
                saveGiaDraft(objData);
                setDtLastSaved(new Date());
                setStrSaveState('saved');
            }, 650);
            return () =>
            {
                window.clearTimeout(intTimer);
            };
        }, [objData, onDraftChange]);

        const intCompletedRequired = useMemo(
            () => REQUIRED_FIELDS.filter((strField) => String(objData[strField]).trim()).length,
            [objData],
        );
        const intCompletion = Math.round((intCompletedRequired / REQUIRED_FIELDS.length) * 100);

        // Save whatever the user last typed if they navigate away before the
        // debounce above has a chance to fire. Runs once, only on unmount.
        useEffect(() =>
        {
            return () =>
            {
                if (!objSubmitted.current)
                {
                    saveGiaDraft(objLatestData.current);
                }
            };
        }, []);

        /** Update. */
        function _update<K extends GiaProposalField>(udtField: K, objValue: GiaProposalData[K])
        {
            setObjData((objCurrent) => ({ ...objCurrent, [udtField]: objValue }));
            setObjErrors((objCurrent) =>
            {
                if (!objCurrent[udtField])
                {
                    return objCurrent;
                }
                const objNext = { ...objCurrent };
                delete objNext[udtField];
                return objNext;
            });
        }

        /** Input. */
        function _input(
            strField: GiaProposalField,
            objOptions?: { type?: string; placeholder?: string; },
        )
        {
            return (
                <input
                    aria-invalid={Boolean(objErrors[strField])}
                    className={cn(
                        INPUT_CLASS,
                        objErrors[strField] &&
                        'border-red-500 focus:border-red-600 focus:ring-red-100',
                    )}
                    name={strField}
                    onChange={(objEvent) =>
                        _update(strField, objEvent.target.value as GiaProposalData[typeof strField])
                    }
                    placeholder={objOptions?.placeholder}
                    type={objOptions?.type ?? 'text'}
                    value={objData[strField]}
                />
            );
        }

        /** Textarea. */
        function _textarea(strField: GiaProposalField, strPlaceholder: string)
        {
            return (
                <textarea
                    aria-invalid={Boolean(objErrors[strField])}
                    className={cn(
                        INPUT_CLASS,
                        'min-h-28 resize-y',
                        objErrors[strField] &&
                        'border-red-500 focus:border-red-600 focus:ring-red-100',
                    )}
                    name={strField}
                    onChange={(objEvent) =>
                        _update(strField, objEvent.target.value as GiaProposalData[typeof strField])
                    }
                    placeholder={strPlaceholder}
                    value={objData[strField]}
                />
            );
        }

        /** Select. */
        function _select(strField: 'projectCategory' | 'projectType', arrOptions: string[])
        {
            return (
                <select
                    aria-invalid={Boolean(objErrors[strField])}
                    className={cn(INPUT_CLASS, objErrors[strField] && 'border-red-500')}
                    name={strField}
                    onChange={(objEvent) => _update(strField, objEvent.target.value)}
                    value={objData[strField]}
                >
                    <option value="">Select an option</option>
                    {arrOptions.map((strOption) => (
                        <option key={strOption} value={strOption}>
                            {strOption}
                        </option>
                    ))}
                </select>
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
                                    .querySelector(`[name="${strFirstError}"]`)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                            0,
                        );
                        return null;
                    }
                    // Marks the draft as "handed off" so the unmount-save effect above
                    // doesn't overwrite what the parent is about to submit with a stale
                    // localStorage draft on the reload that follows a successful submit.
                    objSubmitted.current = true;
                    return objData;
                },
            }),
            [objData],
        );

        return (
            <div className="space-y-5">
                <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
                    <div className="h-1 bg-amber-500" />
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
                        <div className="max-w-2xl">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                                GIA Online Proposal Registration
                            </p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#073b82] sm:text-3xl">
                                Register GIA Proposal
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Provide the implementing organization, project rationale,
                                objectives, implementation approach, and expected results.
                            </p>
                        </div>
                        <div className="shrink-0 rounded-lg bg-amber-50 px-4 py-3 sm:w-48">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-500">Required fields</span>
                                <span className="text-amber-700">
                                    {intCompletedRequired}/{REQUIRED_FIELDS.length}
                                </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                                <div
                                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                                    style={{ width: `${intCompletion}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-right text-[10px] font-bold text-amber-700">
                                {intCompletion}% complete
                            </p>
                        </div>
                    </div>
                </section>

                {Object.keys(objErrors).length ? (
                    <div
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                        role="alert"
                    >
                        Please complete the highlighted fields.
                    </div>
                ) : null}

                <Section icon={Building2} id="gia-proponent" title="1. Proponent Information">
                    <div className="space-y-5">
                        <fieldset>
                            <legend className="text-sm font-bold text-slate-700">
                                Proponent Category <span className="text-red-600">*</span>
                            </legend>
                            <div className="mt-2 grid gap-3 md:grid-cols-3">
                                {GIA_PROPONENT_CATEGORIES.map((strCategory) => (
                                    <label
                                        className={cn(
                                            'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition',
                                            objData.proponentCategory === strCategory
                                                ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                                                : 'border-slate-200 text-slate-700 hover:border-amber-300',
                                        )}
                                        key={strCategory}
                                    >
                                        <input
                                            checked={objData.proponentCategory === strCategory}
                                            className="size-4 accent-amber-600"
                                            name="proponentCategory"
                                            onChange={() =>
                                                _update(
                                                    'proponentCategory',
                                                    strCategory as GiaProponentCategory,
                                                )
                                            }
                                            type="radio"
                                        />
                                        {strCategory}
                                    </label>
                                ))}
                            </div>
                            {objErrors.proponentCategory ? (
                                <p className="mt-1.5 text-xs font-semibold text-red-600">
                                    {objErrors.proponentCategory}
                                </p>
                            ) : null}
                        </fieldset>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                strError={objErrors.organizationName}
                                strLabel="Organization Name"
                            >
                                <span>
                                    {_input('organizationName', {
                                        placeholder: 'Implementing organization',
                                    })}
                                </span>
                            </Field>
                            <Field strError={objErrors.projectLeader} strLabel="Project Leader">
                                <span>{_input('projectLeader', { placeholder: 'Full name' })}</span>
                            </Field>
                            <Field strError={objErrors.position} strLabel="Position / Designation">
                                <span>
                                    {_input('position', { placeholder: 'Official designation' })}
                                </span>
                            </Field>
                            <Field strError={objErrors.contactNumber} strLabel="Contact Number">
                                <span>
                                    {_input('contactNumber', {
                                        placeholder: '09XX XXX XXXX',
                                        type: 'tel',
                                    })}
                                </span>
                            </Field>
                            <Field strError={objErrors.emailAddress} strLabel="Email Address">
                                <span>
                                    {_input('emailAddress', {
                                        placeholder: 'name@example.com',
                                        type: 'email',
                                    })}
                                </span>
                            </Field>
                            <Field strError={objErrors.officeAddress} strLabel="Office Address">
                                <span>
                                    {_input('officeAddress', {
                                        placeholder: 'Complete office address',
                                    })}
                                </span>
                            </Field>
                        </div>
                    </div>
                </Section>

                <Section icon={Target} id="gia-project" title="2. Project Information">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field strError={objErrors.projectTitle} strLabel="Project Title">
                                <span>
                                    {_input('projectTitle', {
                                        placeholder: 'Clear and concise project title',
                                    })}
                                </span>
                            </Field>
                        </div>
                        <Field strError={objErrors.projectCategory} strLabel="Project Category">
                            <span>{_select('projectCategory', GIA_PROJECT_CATEGORIES)}</span>
                        </Field>
                        <Field strError={objErrors.projectType} strLabel="Project Type">
                            <span>{_select('projectType', GIA_PROJECT_TYPES)}</span>
                        </Field>
                        <div className="sm:col-span-2">
                            <Field strError={objErrors.projectSummary} strLabel="Project Summary">
                                <span>
                                    {_textarea(
                                        'projectSummary',
                                        'Briefly describe the proposed project.',
                                    )}
                                </span>
                            </Field>
                        </div>
                        <div className="sm:col-span-2">
                            <Field
                                strError={objErrors.projectRationale}
                                strLabel="Project Rationale"
                            >
                                <span>
                                    {_textarea(
                                        'projectRationale',
                                        'Explain the problem or need the project will address.',
                                    )}
                                </span>
                            </Field>
                        </div>
                        <Field strError={objErrors.generalObjective} strLabel="General Objective">
                            <span>
                                {_textarea('generalObjective', 'State the overall objective.')}
                            </span>
                        </Field>
                        <Field
                            strError={objErrors.specificObjectives}
                            strLabel="Specific Objectives"
                        >
                            <span>
                                {_textarea('specificObjectives', 'List the specific objectives.')}
                            </span>
                        </Field>
                    </div>
                </Section>

                <Section
                    icon={ClipboardList}
                    id="gia-implementation"
                    title="3. Implementation and Results"
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            strError={objErrors.siteOfImplementation}
                            strLabel="Site of Implementation"
                        >
                            <span>
                                {_input('siteOfImplementation', {
                                    placeholder: 'Municipality, barangay, or facility',
                                })}
                            </span>
                        </Field>
                        <Field
                            strError={objErrors.targetBeneficiaries}
                            strLabel="Target Beneficiaries"
                        >
                            <span>
                                {_input('targetBeneficiaries', {
                                    placeholder: 'Primary beneficiaries',
                                })}
                            </span>
                        </Field>
                        <Field strError={objErrors.methodology} strLabel="Implementation Approach">
                            <span>
                                {_textarea(
                                    'methodology',
                                    'Summarize the major activities and approach.',
                                )}
                            </span>
                        </Field>
                        <Field strError={objErrors.expectedOutputs} strLabel="Expected Outputs">
                            <span>
                                {_textarea(
                                    'expectedOutputs',
                                    'List the expected results or deliverables.',
                                )}
                            </span>
                        </Field>
                        <div className="sm:col-span-2">
                            <Field
                                strError={objErrors.sustainabilityPlan}
                                strLabel="Sustainability Plan"
                            >
                                <span>
                                    {_textarea(
                                        'sustainabilityPlan',
                                        'Explain how project benefits will continue after implementation.',
                                    )}
                                </span>
                            </Field>
                        </div>
                    </div>
                </Section>

                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                        {strSaveState === 'saving' ? (
                            <LoaderCircle className="size-4 shrink-0 animate-spin text-amber-600" />
                        ) : dtLastSaved ? (
                            <Check className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                            <Save className="size-4 shrink-0 text-slate-400" />
                        )}
                        <span>
                            {strSaveState === 'saving'
                                ? 'Saving GIA draft...'
                                : dtLastSaved
                                    ? `GIA draft saved at ${dtLastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : 'GIA draft auto-save is on'}
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                        Complete the supporting documents below before submitting.
                    </p>
                </div>
            </div>
        ); // end return
    } /* end GiaProposalForm */,
);

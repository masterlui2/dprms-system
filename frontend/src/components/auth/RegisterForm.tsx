/**
 * System: DPRMS
 * Purpose: Render register form for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import { registerUserAccount, setAuthToken, setMockUser } from '../../lib/mock_auth';
import { grantProgramAccess } from '../../lib/program_access';
import { clearApplications } from '../../services/application_store';
import { registerWithBackend } from '../../services/auth_service';
import { clearGiaDraft } from '../../services/gia_proposal_store';
import { clearSetupDraft } from '../../services/setup_proposal_store';
import type { ApplicationProgram } from '../../types/application';
import { DostBrand } from './DostBrand';

const ROLE_OPTIONS = [
    {
        description:
            'For SETUP proposals from MSMEs or enterprises requesting technology upgrading support.',
        label: ' SETUP Proponent',
        value: 'MSME_PROPONENT',
    },
    {
        description:
            'For GIA proposals led by project leaders, organizations, schools, or community groups.',
        label: 'GIA Project Leader',
        value: 'GIA_PROJECT_LEADER',
    },
] as const;

type RegisterRole = (typeof ROLE_OPTIONS)[number]['value'];

const DEFAULT_ROLE: RegisterRole = 'MSME_PROPONENT';

const ROLE_DESCRIPTIONS: Record<RegisterRole, string> = {
    GIA_PROJECT_LEADER:
        'GIA accounts are for project leaders submitting public benefit, research, training, or community-based proposals.',
    MSME_PROPONENT:
        'MSME accounts are for SETUP proponents submitting enterprise upgrading and technology assistance proposals.',
};

const ROLE_LABELS: Record<RegisterRole, string> = {
    GIA_PROJECT_LEADER: 'GIA Project Leader',
    MSME_PROPONENT: 'MSME / SETUP Proponent',
};

const g_objRoleValueSet = new Set<RegisterRole>(['MSME_PROPONENT', 'GIA_PROJECT_LEADER']);

/** Is register role. */
function _isRegisterRole(strValue: string): strValue is RegisterRole
{
    return g_objRoleValueSet.has(strValue as RegisterRole);
}

/** Get selected program. */
function _getSelectedProgram(strValue: string | null): ApplicationProgram | null
{
    const strProgram = strValue?.toUpperCase();

    if (strProgram === 'GIA' || strProgram === 'SETUP')
    {
        return strProgram;
    }

    return null;
}

/** Get safe redirect. */
function _getSafeRedirect(strValue: string | null, strProgram: ApplicationProgram | null)
{
    if (!strValue || !strProgram)
    {
        return null;
    }

    const strExpectedPath = `/programs/${strProgram.toLowerCase()}`;
    const strExpectedTarget = `${strExpectedPath}/register`;

    return strValue === strExpectedPath || strValue === strExpectedTarget
        ? strValue
        : strExpectedTarget;
}

/** Render register form and its available actions. */
export function RegisterForm()
{
    const _navigate = useNavigate();
    const [objSearchParams] = useSearchParams();
    const strSelectedProgram = _getSelectedProgram(objSearchParams.get('program'));
    const strRedirectTo = _getSafeRedirect(objSearchParams.get('redirect'), strSelectedProgram);
    const strInitialRole: RegisterRole =
        strSelectedProgram === 'GIA' ? 'GIA_PROJECT_LEADER' : DEFAULT_ROLE;
    const [objForm, setObjForm] = useState({
        confirmPassword: '',
        email: '',
        fullName: '',
        password: '',
        role: strInitialRole,
    });
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
    const [txtMessage, setTxtMessage] = useState<string | null>(null);

    /** Handle submit. */
    async function _handleSubmit(objEvent: FormEvent<HTMLFormElement>)
    {
        objEvent.preventDefault();
        setTxtMessage(null);

        if (objForm.password !== objForm.confirmPassword)
        {
            setTxtMessage('Password and confirm password must match.');
            return;
        }

        setBlnIsSubmitting(true);

        try
        {
            const objResult = await registerWithBackend({
                email: objForm.email,
                name: objForm.fullName,
                password: objForm.password,
                password_confirmation: objForm.confirmPassword,
                role: objForm.role,
            });

            if (objResult.token)
            {
                setAuthToken(objResult.token);
            }

            const strProgram: ApplicationProgram =
                strSelectedProgram ?? (objForm.role === 'GIA_PROJECT_LEADER' ? 'GIA' : 'SETUP');

            grantProgramAccess(strProgram);
            const objRegisteredUser = registerUserAccount({
                id: objResult.user.id,
                email: objForm.email,
                name: objForm.fullName,
                password: objForm.password,
                program: strProgram,
            });
            // Clear any stale application data from a previous session
            clearApplications();
            clearSetupDraft();
            clearGiaDraft();
            setMockUser({
                ...objRegisteredUser,
                id: objResult.user.id,
                role: objResult.user.role || objRegisteredUser.role,
            });

            const strTargetPath =
                strRedirectTo ??
                (strProgram === 'GIA'
                    ? '/gia/dashboard/my-proposal'
                    : '/setup/dashboard/my-application');

            _navigate(strTargetPath, { replace: true });
        } /* end try */ catch (errError)
        {
            reportError(errError, 'RegisterForm: handle submit failed.');

            setTxtMessage(
                errError instanceof Error
                    ? errError.message
                    : 'Registration failed. Please try again.',
            );
        } finally
        {
            setBlnIsSubmitting(false);
        }
    } /* end _handleSubmit */

    /** Update field. */
    function _updateField(strField: keyof typeof objForm, strValue: string)
    {
        setObjForm((objCurrent) => ({ ...objCurrent, [strField]: strValue }));
        setTxtMessage(null);
    }

    return (
        <section className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-10 lg:px-12">
            <div className="w-full max-w-xl">
                <div className="mb-8 flex items-center justify-between lg:hidden">
                    <DostBrand />
                    <Link
                        aria-label="Back to login"
                        className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#073b82]"
                        title="Back to login"
                        to="/login"
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                </div>

                <header>
                    <p className="text-sm font-black uppercase tracking-wide text-[#0f53b7]">
                        Proponent Registration
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[#073b82] sm:text-4xl">
                        Create your portal account
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Register as a proponent to prepare GIA or SETUP proposals and track official
                        review updates.
                    </p>
                </header>

                <form className="mt-8 space-y-5" noValidate onSubmit={_handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            strAutoComplete="name"
                            strLabel="Full name"
                            onChange={(strValue) => _updateField('fullName', strValue)}
                            placeholder="Juan Dela Cruz"
                            required
                            value={objForm.fullName}
                        />
                        <Field
                            strAutoComplete="email"
                            strLabel="Email address"
                            onChange={(strValue) => _updateField('email', strValue)}
                            placeholder="you@example.com"
                            required
                            type="email"
                            value={objForm.email}
                        />
                    </div>

                    <label className="block">
                        <span className="text-sm font-bold text-slate-800">
                            Account role <span className="text-red-600">*</span>
                        </span>
                        <select
                            className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                            disabled={Boolean(strSelectedProgram)}
                            onChange={(objEvent) =>
                            {
                                const strNextRole = objEvent.target.value;

                                if (_isRegisterRole(strNextRole))
                                {
                                    _updateField('role', strNextRole);
                                }
                            }}
                            value={objForm.role}
                        >
                            {ROLE_OPTIONS.map((objRole) => (
                                <option key={objRole.value} value={objRole.value}>
                                    {objRole.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {ROLE_DESCRIPTIONS[objForm.role]}
                        </p>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            strAutoComplete="new-password"
                            strLabel="Password"
                            onChange={(strValue) => _updateField('password', strValue)}
                            placeholder="Minimum 8 characters"
                            required
                            type="password"
                            value={objForm.password}
                        />
                        <Field
                            strAutoComplete="new-password"
                            strLabel="Confirm password"
                            onChange={(strValue) => _updateField('confirmPassword', strValue)}
                            placeholder="Re-enter password"
                            required
                            type="password"
                            value={objForm.confirmPassword}
                        />
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        <input
                            className="mt-1 size-4 rounded accent-[#0f53b7]"
                            required
                            type="checkbox"
                        />
                        <span>
                            I confirm that this account will be registered as{' '}
                            <span className="font-bold text-slate-800">
                                {ROLE_LABELS[objForm.role]}
                            </span>{' '}
                            for DOST GIA / SETUP proposal processing.
                        </span>
                    </label>

                    {txtMessage ? (
                        <p
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-900"
                            role="status"
                        >
                            {txtMessage}
                        </p>
                    ) : null}

                    <button
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f53b7] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b]"
                        disabled={blnIsSubmitting}
                        type="submit"
                    >
                        {blnIsSubmitting ? 'Creating account...' : 'Create account'}
                        <ArrowRight className="size-4" />
                    </button>

                    <p className="text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link className="font-black text-[#0f53b7] hover:underline" to="/login">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </section>
    ); // end return
} /* end RegisterForm */

/** Render field and its available actions. */
function Field({
    strAutoComplete,
    strLabel,
    onChange,
    placeholder: strPlaceholder,
    required: blnRequired = false,
    type: strType = 'text',
    value: strValue,
}: {
    strAutoComplete?: string;
    strLabel: string;
    onChange: (strValue: string) => void;
    placeholder: string;
    required?: boolean;
    type?: string;
    value: string;
})
{
    return (
        <label className="block">
            <span className="text-sm font-bold text-slate-800">
                {strLabel}
                {blnRequired ? <span className="ml-1 text-red-600">*</span> : null}
            </span>
            <input
                autoComplete={strAutoComplete}
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                onChange={(objEvent) => onChange(objEvent.target.value)}
                placeholder={strPlaceholder}
                required={blnRequired}
                type={strType}
                value={strValue}
            />
        </label>
    );
}

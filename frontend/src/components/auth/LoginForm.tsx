/**
 * System: DPRMS
 * Purpose: Render login form for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import { getDefaultRedirect, PROPONENT_USER, setAuthToken, setMockUser } from '../../lib/mock_auth';
import { grantProgramAccess } from '../../lib/program_access';
import { syncUserApplicationsFromBackend } from '../../services/application_store';
import { AuthError, loginWithBackend } from '../../services/auth_service';
import { clearGiaDraft } from '../../services/gia_proposal_store';
import { clearSetupDraft } from '../../services/setup_proposal_store';
import { DostBrand } from './DostBrand';

/** Render login form and its available actions. */
export function LoginForm()
{
    const _navigate = useNavigate();
    const [strEmail, setStrEmail] = useState('');
    const [strPassword, setStrPassword] = useState('');
    const [blnShowPassword, setBlnShowPassword] = useState(false);
    const [blnKeepSignedIn, setBlnKeepSignedIn] = useState(false);
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
    const [txtMessage, setTxtMessage] = useState<string | null>(null);

    /** Handle submit. */
    async function _handleSubmit(objEvent: FormEvent<HTMLFormElement>)
    {
        objEvent.preventDefault();

        if (!strEmail.trim() || !strPassword)
        {
            setTxtMessage('Please enter your registered email address and password.');
            return;
        }

        setBlnIsSubmitting(true);

        try
        {
            const { token: strToken, user: objUser } = await loginWithBackend(
                strEmail,
                strPassword,
            );

            setTxtMessage(null);
            setAuthToken(strToken);
            clearSetupDraft();
            clearGiaDraft();
            if (objUser.program)
            {
                grantProgramAccess(objUser.program);
            }
            const arrSyncedApps = await syncUserApplicationsFromBackend(objUser);
            if (arrSyncedApps.length > 0)
            {
                objUser.applicationReference = arrSyncedApps[0].referenceNo;
            } else
            {
                delete objUser.applicationReference;
            }
            setMockUser(objUser);
            _navigate(getDefaultRedirect(objUser));
        } catch (errError)
        {
            reportError(errError, 'LoginForm: handle submit failed.');

            setTxtMessage(
                errError instanceof AuthError
                    ? errError.message
                    : 'Unable to connect to the authentication server.',
            );
        } finally
        {
            setBlnIsSubmitting(false);
        }
    } /* end _handleSubmit */

    return (
        <section className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-10 lg:px-12">
            <div className="w-full max-w-md">
                <div className="mb-10 flex items-center justify-between lg:hidden">
                    <DostBrand />
                    <Link
                        aria-label="Back to home"
                        className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#073b82] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        title="Back to home"
                        to="/"
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                </div>

                <header>
                    <h2 className="text-3xl font-black text-[#073b82] sm:text-4xl">Welcome back</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Sign in to continue to the DOST workspace for administrators and project
                        proponents.
                    </p>
                </header>

                <form className="mt-8 space-y-5" noValidate onSubmit={_handleSubmit}>
                    <button
                        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:bg-slate-100"
                        onClick={() =>
                        {
                            const objGoogleUser = PROPONENT_USER;
                            if (objGoogleUser.program)
                            {
                                grantProgramAccess(objGoogleUser.program);
                            }
                            setMockUser(objGoogleUser);
                            _navigate(getDefaultRedirect(objGoogleUser));
                        }}
                        type="button"
                    >
                        <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            or sign in with email
                        </span>
                        <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-800" htmlFor="login-email">
                            Email address
                        </label>
                        <input
                            autoComplete="email"
                            className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                            id="login-email"
                            onChange={(objEvent) =>
                            {
                                setStrEmail(objEvent.target.value);
                                setTxtMessage(null);
                            }}
                            placeholder="you@example.com"
                            type="email"
                            value={strEmail}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <label
                                className="text-sm font-bold text-slate-800"
                                htmlFor="login-password"
                            >
                                Password
                            </label>
                            <button
                                className="text-xs font-bold text-[#0f53b7] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                onClick={() =>
                                    setTxtMessage(
                                        'Please contact your DOST office to recover your account.',
                                    )
                                }
                                type="button"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <div className="relative mt-2">
                            <input
                                autoComplete="current-password"
                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                                id="login-password"
                                onChange={(objEvent) =>
                                {
                                    setStrPassword(objEvent.target.value);
                                    setTxtMessage(null);
                                }}
                                placeholder="Enter your password"
                                type={blnShowPassword ? 'text' : 'password'}
                                value={strPassword}
                            />
                            <button
                                aria-label={blnShowPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                onClick={() => setBlnShowPassword((blnCurrent) => !blnCurrent)}
                                title={blnShowPassword ? 'Hide password' : 'Show password'}
                                type="button"
                            >
                                {blnShowPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {txtMessage ? (
                        <p
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-900"
                            role="status"
                        >
                            {txtMessage}
                        </p>
                    ) : null}

                    <label
                        className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600"
                        htmlFor="keep-signed-in"
                    >
                        <input
                            checked={blnKeepSignedIn}
                            className="size-4 rounded accent-[#0f53b7]"
                            id="keep-signed-in"
                            onChange={(objEvent) => setBlnKeepSignedIn(objEvent.target.checked)}
                            type="checkbox"
                        />
                        Keep me signed in
                    </label>

                    <button
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f53b7] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                        disabled={blnIsSubmitting}
                        type="submit"
                    >
                        {blnIsSubmitting ? 'Signing in...' : 'Sign in'}
                        <ArrowRight className="size-4" />
                    </button>

                    <p className="text-center text-sm text-slate-600">
                        New proponent?{' '}
                        <Link className="font-black text-[#0f53b7] hover:underline" to="/register">
                            Create an account
                        </Link>
                    </p>
                </form>
            </div>
        </section>
    ); // end return
} /* end LoginForm */

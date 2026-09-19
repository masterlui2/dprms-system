/**
 * System: DPRMS
 * Purpose: Render login for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel';
import { LoginForm } from '../components/auth/LoginForm';

/** Render login and its available actions. */
export function Login()
{
    return (
        <main className="grid min-h-screen bg-white text-slate-950 lg:grid-cols-2">
            <LoginBrandPanel />
            <LoginForm />
        </main>
    );
}

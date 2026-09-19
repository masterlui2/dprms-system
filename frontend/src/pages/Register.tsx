/**
 * System: DPRMS
 * Purpose: Render register for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel';
import { RegisterForm } from '../components/auth/RegisterForm';

/** Render register and its available actions. */
export function Register()
{
    return (
        <main className="grid min-h-screen bg-white text-slate-950 lg:grid-cols-2">
            <LoginBrandPanel />
            <RegisterForm />
        </main>
    );
}

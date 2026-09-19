/**
 * System: DPRMS
 * Purpose: Render module workspace for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPanel } from '../../components/admin/AdminPanel';

/** Render module workspace and its available actions. */
export function ModuleWorkspace({
    txtDescription,
    title: strTitle,
}: {
    txtDescription: string;
    title: string;
})
{
    return (
        <div className="space-y-6">
            <AdminPageHeader
                txtDescription={txtDescription}
                strEyebrow="DPRMS Module"
                title={strTitle}
            />
            <AdminPanel title={strTitle}>
                <div className="px-5 py-8 text-sm leading-6 text-slate-600">
                    This workspace is available to your role. Its management tools can be added here
                    without changing the shared DPRMS navigation or permission model.
                </div>
            </AdminPanel>
        </div>
    );
}

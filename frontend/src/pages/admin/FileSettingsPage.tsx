/**
 * System: DPRMS
 * Purpose: Render file settings page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ExportDirectorySettings } from '../../components/common/ExportDirectorySettings';
import { getMockUser } from '../../lib/mock_auth';

/** Keep old bookmarks working; settings are now available from Account. */
export function FileSettingsPage()
{
    const objUser = getMockUser();
    if (!objUser)
    {
        return null;
    }
    return (
        <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div>
                <h1 className="text-2xl font-bold text-[#073b82]">Report Export Directory</h1>
                <p className="mt-1 text-sm text-slate-500">
                    You can also manage this destination from your Account menu.
                </p>
            </div>
            <ExportDirectorySettings objUser={objUser} />
        </div>
    );
}

/**
 * System: DPRMS
 * Purpose: Render admin sidebar for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { LogOut, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import logoImage from '../../assets/logo.png';
import { ROLE_LABEL } from '../../config/permissions';
import { getSidebarItems, type SidebarItem, type SidebarSubItem } from '../../config/sidebar_items';
import { clearMockUser, type MockUser } from '../../lib/mock_auth';
import { cn } from '../../utils/cn';

/** Is route path active. */
function _isRoutePathActive(strPathname: string, strRoute: string): boolean
{
    const [strRoutePath] = strRoute.split('?');

    if (strRoutePath === '/dashboard')
    {
        return strPathname === strRoutePath;
    }
    return strPathname === strRoutePath || strPathname.startsWith(`${strRoutePath}/`);
}

/** Is sub route active. */
function _isSubRouteActive(strPathname: string, strSearch: string, strRoute: string): boolean
{
    const [strRoutePath, strRouteQuery] = strRoute.split('?');
    if (!_isRoutePathActive(strPathname, strRoutePath))
    {
        return false;
    }
    if (!strRouteQuery)
    {
        return strSearch === '';
    }

    const objCurrentParams = new URLSearchParams(strSearch);
    const objExpectedParams = new URLSearchParams(strRouteQuery);
    let blnMatches = true;
    objExpectedParams.forEach((strValue, strKey) =>
    {
        if (objCurrentParams.get(strKey) !== strValue)
        {
            blnMatches = false;
        }
    });
    return blnMatches;
}

/** Render sidebar item and its available actions. */
function SidebarItem({
    blnCollapsed,
    blnIsActive,
    objItem,
    onNavigate,
}: {
    blnCollapsed: boolean;
    blnIsActive: boolean;
    objItem: SidebarItem;
    onNavigate?: () => void;
})
{
    const objLocation = useLocation();
    const blnHasSubItems = Boolean(objItem.subItems && objItem.subItems.length > 0);
    const blnIsParentActive = _isRoutePathActive(objLocation.pathname, objItem.route);

    const strClassName = cn(
        'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
        blnCollapsed && 'justify-center px-0',
        blnIsActive
            ? 'bg-[#e8f1ff] text-[#073b82] shadow-sm ring-1 ring-[#b9d2f2]'
            : 'text-slate-700 hover:bg-white/75 hover:text-[#073b82]',
    );

    const arrSubItems = objItem.subItems ?? [];
    const blnShowSubmenu = !blnCollapsed && blnHasSubItems && blnIsParentActive;

    return (
        <div className="space-y-1">
            <NavLink
                aria-current={blnIsActive ? 'page' : undefined}
                className={strClassName}
                onClick={onNavigate}
                title={objItem.label}
                to={objItem.route}
            >
                <objItem.icon className="h-4 w-4 shrink-0" />
                {!blnCollapsed ? (
                    <span className="min-w-0 flex-1 truncate">{objItem.label}</span>
                ) : null}
            </NavLink>

            {blnShowSubmenu ? (
                <div className="ml-4 space-y-0.5 border-l-2 border-[#d8e1ee] pl-2 pt-1">
                    {arrSubItems.map((objSub: SidebarSubItem) =>
                    {
                        const blnIsSubActive = _isSubRouteActive(
                            objLocation.pathname,
                            objLocation.search,
                            objSub.route,
                        );

                        return (
                            <NavLink
                                aria-current={blnIsSubActive ? 'page' : undefined}
                                key={objSub.label}
                                to={objSub.route}
                                onClick={onNavigate}
                                className={cn(
                                    'flex h-8 items-center rounded-md px-2.5 text-xs font-semibold transition',
                                    blnIsSubActive
                                        ? 'bg-blue-50/90 font-bold text-[#073b82]'
                                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                                )}
                            >
                                <span className="truncate">{objSub.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            ) : null}
        </div>
    ); // end return
} /* end SidebarItem */

/** Render admin sidebar and its available actions. */
export function AdminSidebar({
    blnCollapsed = false,
    blnMobileOpen = false,
    onClose,
    objUser,
}: {
    blnCollapsed?: boolean;
    blnMobileOpen?: boolean;
    onClose?: () => void;
    objUser: MockUser;
})
{
    const objLocation = useLocation();
    const _navigate = useNavigate();
    const arrVisible = getSidebarItems(objUser.role, objUser.program, objUser.backendRole);
    /** Is active. */
    const _isActive = (strRoute: string) => _isRoutePathActive(objLocation.pathname, strRoute);

    /** Handle sign out. */
    function _handleSignOut()
    {
        clearMockUser();
        onClose?.();
        _navigate('/login');
    }

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-40 w-[280px] border-r border-[#d8e1ee] bg-[#f7fbff] shadow-xl transition-transform lg:static lg:z-auto lg:h-full lg:w-auto lg:translate-x-0 lg:shadow-none',
                blnMobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
        >
            <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b border-[#d8e1ee] px-6 py-4">
                    <NavLink
                        className={cn(
                            'flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                            blnCollapsed && 'justify-center px-0',
                        )}
                        onClick={onClose}
                        title="DOST DPRMS"
                        to="/dashboard"
                    >
                        <span className="grid size-16 shrink-0 place-items-center overflow-hidden">
                            <img alt="DOST XI" className="size-14 object-contain" src={logoImage} />
                        </span>
                        {!blnCollapsed ? (
                            <span className="min-w-0 leading-tight">
                                <span className="block text-lg font-extrabold text-[#073b82]">
                                    DOST
                                </span>
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    DPRMS
                                </span>
                            </span>
                        ) : null}
                    </NavLink>
                    <button
                        aria-label="Close navigation"
                        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white lg:hidden"
                        onClick={onClose}
                        type="button"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <nav className="space-y-1">
                        {arrVisible.map((objItem) =>
                        {
                            return (
                                <div key={objItem.id}>
                                    <SidebarItem
                                        blnCollapsed={blnCollapsed}
                                        blnIsActive={_isActive(objItem.route)}
                                        objItem={objItem}
                                        onNavigate={onClose}
                                    />
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-[#d8e1ee] bg-white px-3 py-4">
                    {!blnCollapsed ? (
                        <div className="px-2 pb-3">
                            <div className="truncate text-sm font-semibold text-slate-900">
                                {objUser.name}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                                {ROLE_LABEL[objUser.role]}
                            </div>
                        </div>
                    ) : null}
                    <button
                        className={cn(
                            'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                            blnCollapsed && 'justify-center px-0',
                        )}
                        onClick={_handleSignOut}
                        title="Sign out"
                        type="button"
                    >
                        <LogOut className="h-4 w-4" />
                        {!blnCollapsed ? <span>Sign out</span> : null}
                    </button>
                </div>
            </div>
        </aside>
    ); // end return
} /* end AdminSidebar */

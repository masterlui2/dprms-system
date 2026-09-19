/**
 * System: DPRMS
 * Purpose: Render site header for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    ArrowRight,
    Bell,
    ChevronDown,
    FilePenLine,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Menu,
    ReceiptText,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import logoImage from '../../assets/logo2.png';
import { clearMockUser, getMockUser, type MockUser } from '../../lib/mock_auth';
import { useUnreadNotificationCount } from '../../services/notification_store';
import
{
    getProponentProfile,
    PROFILE_UPDATED_EVENT,
    type ProponentProfile,
} from '../../services/profile_store';
import { NotificationPanel } from '../admin/NotificationPanel';
import { AccountExportDirectory } from '../common/ExportDirectorySettings';

/** Get program home path. */
function _getProgramHomePath(strPathname: string, objUser?: MockUser | null)
{
    if (strPathname.startsWith('/programs/gia') || strPathname.startsWith('/gia'))
    {
        return '/programs/gia';
    }
    if (strPathname.startsWith('/programs/setup') || strPathname.startsWith('/setup'))
    {
        return '/programs/setup';
    }
    if (objUser?.program === 'GIA')
    {
        return '/programs/gia';
    }
    if (objUser?.program === 'SETUP')
    {
        return '/programs/setup';
    }

    return '/';
}

/** Get navigation items. */
function _getNavigationItems(strPathname: string, objUser?: MockUser | null)
{
    const strHomeHref = _getProgramHomePath(strPathname, objUser);
    const blnIsProgramContext =
        strHomeHref === '/programs/gia' || strHomeHref === '/programs/setup';

    return [
        { label: 'Home', href: '/' },
        { label: 'Programs', href: '/#programs' },
        {
            label: 'How to Apply',
            href: blnIsProgramContext ? `${strHomeHref}#process` : '/#process',
        },
        {
            label: 'Requirements',
            href: blnIsProgramContext ? `${strHomeHref}#requirements` : '/#requirements',
        },
        { label: 'Track Proposal', href: '/login' },
        { label: 'FAQs', href: '/#faq' },
        { label: 'Contact', href: '/#contact' },
    ];
}

const PROGRAM_OPTIONS = [
    { label: 'GIA', href: '/programs/gia' },
    { label: 'SETUP', href: '/programs/setup' },
];

/** Render top bar and its available actions. */
function TopBar()
{
    return (
        <div className="bg-[#073b82] text-xs text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
                <span className="font-semibold">
                    Republic of the Philippines - Department of Science and Technology
                </span>
                <span className="hidden font-semibold text-white/80 sm:inline">
                    An official DOST digital service
                </span>
            </div>
        </div>
    );
}

/** Render logo and its available actions. */
function Logo({ strHomeHref }: { strHomeHref: string; })
{
    const objLocation = useLocation();

    return (
        <Link
            className="flex min-w-0 items-center gap-3"
            to={strHomeHref}
            aria-label="DOST GIA and SETUP Portal home"
            onClick={() =>
            {
                if (
                    objLocation.pathname === strHomeHref ||
                    (strHomeHref === '/' && objLocation.pathname === '/')
                )
                {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }}
        >
            <img
                alt="DOST GIA and SETUP Portal"
                className="h-12 w-auto shrink-0 object-contain sm:h-14"
                src={logoImage}
            />
            <span className="hidden max-w-[280px] leading-tight xl:block">
                <span className="block text-sm font-black text-[#073b82]">
                    DOST Davao Oriental Project Portal
                </span>
            </span>
        </Link>
    ); // end return
} /* end Logo */

/** Render user avatar and its available actions. */
function UserAvatar({
    className: strClassName,
    strInitials,
    strPhotoDataUrl,
}: {
    className: string;
    strInitials: string;
    strPhotoDataUrl?: string;
})
{
    return (
        <span
            className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#073b82] font-black text-white ${strClassName}`}
        >
            {strPhotoDataUrl ? (
                <img alt="" className="h-full w-full object-cover" src={strPhotoDataUrl} />
            ) : (
                strInitials
            )}
        </span>
    );
}

/** Render account dropdown and its available actions. */
function AccountDropdown({
    onNavigate,
    onSignOut,
    objProfile,
    strProgram,
    objUser,
}: {
    onNavigate: () => void;
    onSignOut: () => void;
    objProfile: ProponentProfile | null;
    strProgram: 'SETUP' | 'GIA';
    objUser: MockUser;
})
{
    const blnIsProponent = objUser.role === 'proponent';
    const blnIsGia = strProgram === 'GIA';
    const strProgramPrefix = blnIsGia ? '/gia' : '/setup';
    const strDisplayName = objProfile?.fullName || objUser.name;
    const arrModuleItems = [
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            to: `${strProgramPrefix}/dashboard`,
        },
        {
            icon: FilePenLine,
            label: blnIsGia ? 'My Proposal' : 'My Application',
            to: blnIsGia ? '/gia/dashboard/my-proposal' : '/setup/dashboard/my-application',
        },

        {
            icon: ReceiptText,
            label: blnIsGia ? 'Disbursement Tracking' : 'Repayment / Billing',
            to: `${strProgramPrefix}/dashboard/finance`,
        },
        {
            icon: Bell,
            label: 'Notifications',
            to: `${strProgramPrefix}/dashboard/notifications`,
        },
        { icon: User, label: 'Profile', to: `${strProgramPrefix}/dashboard/profile` },
    ];

    return (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center gap-3">
                    <UserAvatar
                        className="size-11 text-sm"
                        strInitials={objUser.initials}
                        strPhotoDataUrl={objProfile?.photoDataUrl}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">
                            {strDisplayName}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">{objUser.email}</p>
                    </div>
                </div>
            </div>

            {blnIsProponent ? (
                <div className="px-2 py-2">
                    <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"></p>
                    <div className="grid gap-1">
                        {arrModuleItems.map((objItem) =>
                        {
                            const Icon = objItem.icon;

                            return (
                                <Link
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82]"
                                    key={objItem.to}
                                    onClick={onNavigate}
                                    to={objItem.to}
                                >
                                    <Icon className="size-4 text-[#0f53b7]" />
                                    <span>{objItem.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="px-2 py-2">
                    <Link
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82]"
                        onClick={onNavigate}
                        to="/dashboard"
                    >
                        <LayoutDashboard className="size-4 text-[#0f53b7]" />
                        Dashboard
                    </Link>
                </div>
            )}

            <div className="grid gap-1 border-t border-slate-100 px-2 py-2">
                <AccountExportDirectory objUser={objUser} />
                <Link
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82]"
                    onClick={onNavigate}
                    to="/#contact"
                >
                    <HelpCircle className="size-4 text-[#0f53b7]" />
                    Help and support
                </Link>
                <button
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                    onClick={onSignOut}
                    type="button"
                >
                    <LogOut className="size-4" />
                    Sign out
                </button>
            </div>
        </div>
    ); // end return
} /* end AccountDropdown */

/** Render site header and its available actions. */
export function SiteHeader()
{
    const _navigate = useNavigate();
    const objLocation = useLocation();
    const objUser = getMockUser();
    const [blnOpen, setBlnOpen] = useState(false);
    const [blnProgramsOpen, setBlnProgramsOpen] = useState(false);
    const [blnNotificationsOpen, setBlnNotificationsOpen] = useState(false);
    const [blnAccountOpen, setBlnAccountOpen] = useState(false);
    const [intProfileRevision, setIntProfileRevision] = useState(0);
    const intUnreadNotifications = useUnreadNotificationCount(Boolean(objUser));
    const blnIsProponent = objUser?.role === 'proponent';
    const [objProfile, setObjProfile] = useState<ProponentProfile | null>(null);
    const strActiveProgram: 'SETUP' | 'GIA' =
        objLocation.pathname.startsWith('/gia') || objLocation.pathname.startsWith('/programs/gia')
            ? 'GIA'
            : objLocation.pathname.startsWith('/setup') ||
                objLocation.pathname.startsWith('/programs/setup')
                ? 'SETUP'
                : (objUser?.program ?? 'SETUP');
    const arrNavigationItems = _getNavigationItems(objLocation.pathname, objUser).filter(
        (objItem) => !objUser || objItem.label !== 'Programs',
    );
    const blnProgramsActive =
        objLocation.pathname.startsWith('/programs/gia') ||
        objLocation.pathname.startsWith('/programs/setup');

    useEffect(() =>
    {
        let blnCancelled = false;
        const objCurrentUser = getMockUser();
        if (!objCurrentUser)
        {
            setObjProfile(null);
            return;
        }
        getProponentProfile(objCurrentUser).then((objResult) =>
        {
            if (!blnCancelled)
            {
                setObjProfile(objResult);
            }
        });
        return () =>
        {
            blnCancelled = true;
        };
        // Depend on a primitive because getMockUser() returns a new object on
        // every call. The effect reads the latest user after that key changes.
    }, [objUser?.email, intProfileRevision]);

    useEffect(() =>
    {
        /** Refresh profile. */
        const _refreshProfile = () => setIntProfileRevision((intCurrent) => intCurrent + 1);
        window.addEventListener(PROFILE_UPDATED_EVENT, _refreshProfile);
        return () => window.removeEventListener(PROFILE_UPDATED_EVENT, _refreshProfile);
    }, []);

    /** Handle sign out. */
    function _handleSignOut()
    {
        clearMockUser();
        setBlnAccountOpen(false);
        setBlnNotificationsOpen(false);
        setBlnProgramsOpen(false);
        _navigate('/login');
    }

    /** Is active. */
    function _isActive(strHref: string)
    {
        const [strTargetPath, strTargetHash] = strHref.split('#');

        if (strTargetHash)
        {
            return (
                objLocation.pathname === strTargetPath && objLocation.hash === `#${strTargetHash}`
            );
        }
        return objLocation.pathname === strTargetPath && !objLocation.hash;
    }

    /** Is navigation item active. */
    function _isNavigationItemActive(objItem: { label: string; href: string; })
    {
        if (objItem.label === 'Home')
        {
            return objLocation.pathname === '/' && !objLocation.hash;
        }
        if (objItem.label === 'Programs')
        {
            return (
                blnProgramsActive ||
                (objLocation.pathname === '/' && objLocation.hash === '#programs')
            );
        }
        return _isActive(objItem.href);
    }

    /** Handle nav click. */
    function _handleNavClick(objItem: { label: string; href: string; })
    {
        const [strTargetPath, strTargetHash] = objItem.href.split('#');
        const blnIsTargetRoot = strTargetPath === '' || strTargetPath === '/';
        const blnIsCurrentRoot = objLocation.pathname === '/';

        if (objItem.label === 'Home' || (blnIsTargetRoot && !strTargetHash))
        {
            if (blnIsCurrentRoot)
            {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if (strTargetHash && objLocation.pathname === (strTargetPath || '/'))
        {
            const objElement = document.getElementById(strTargetHash);
            if (objElement)
            {
                objElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    return (
        <header className="sticky top-0 z-40 border-b border-[#d6e9f8] bg-white">
            <TopBar />

            <div className="flex w-full items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-[72px] xl:px-[72px]">
                <div className="min-w-[120px] xl:min-w-[360px]">
                    <Logo strHomeHref="/" />
                </div>

                <nav
                    className="hidden flex-1 -translate-x-4 items-center justify-center gap-1 lg:flex xl:-translate-x-15"
                    aria-label="Primary navigation"
                >
                    {arrNavigationItems.map((objItem) =>
                        objItem.label === 'Programs' ? (
                            <div
                                className="relative"
                                key={objItem.label}
                                onBlur={(objEvent) =>
                                {
                                    if (
                                        !objEvent.currentTarget.contains(
                                            objEvent.relatedTarget as Node | null,
                                        )
                                    )
                                    {
                                        setBlnProgramsOpen(false);
                                    }
                                }}
                                onFocus={() => setBlnProgramsOpen(true)}
                                onMouseEnter={() => setBlnProgramsOpen(true)}
                                onMouseLeave={() => setBlnProgramsOpen(false)}
                            >
                                <button
                                    aria-expanded={blnProgramsOpen}
                                    className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${_isNavigationItemActive(objItem)
                                        ? 'bg-[#eaf6ff] text-[#073b82]'
                                        : 'text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]'
                                        }`}
                                    onClick={() => setBlnProgramsOpen((blnCurrent) => !blnCurrent)}
                                    type="button"
                                >
                                    Programs
                                    <ChevronDown
                                        className={`size-4 transition-transform ${blnProgramsOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {blnProgramsOpen ? (
                                    <div className="absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-2">
                                        <div className="overflow-hidden rounded-lg border border-[#d8e1ee] bg-white p-1 shadow-xl">
                                            {PROGRAM_OPTIONS.map((objProgram) => (
                                                <Link
                                                    className={`block rounded-md px-3 py-2.5 text-sm font-bold transition ${objLocation.pathname === objProgram.href
                                                        ? 'bg-[#eaf6ff] text-[#073b82]'
                                                        : 'text-slate-700 hover:bg-[#f3f8fe] hover:text-[#073b82]'
                                                        }`}
                                                    key={objProgram.href}
                                                    onClick={() =>
                                                    {
                                                        setBlnProgramsOpen(false);
                                                        setBlnOpen(false);
                                                    }}
                                                    to={objProgram.href}
                                                >
                                                    {objProgram.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <Link
                                className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${_isNavigationItemActive(objItem)
                                    ? 'bg-[#eaf6ff] text-[#073b82]'
                                    : 'text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]'
                                    }`}
                                onClick={() => _handleNavClick(objItem)}
                                to={objItem.href}
                                key={objItem.href}
                            >
                                {objItem.label}
                            </Link>
                        ),
                    )}
                </nav>

                <div className="hidden min-w-[90px] items-center justify-end gap-2 lg:flex">
                    {blnIsProponent ? (
                        <>
                            <div className="relative">
                                <button
                                    aria-expanded={blnNotificationsOpen}
                                    aria-label="Notifications"
                                    className="relative inline-flex size-10 items-center justify-center rounded-lg text-[#073b82] transition hover:bg-[#eaf6ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                    onClick={() =>
                                    {
                                        setBlnNotificationsOpen((blnCurrent) => !blnCurrent);
                                        setBlnAccountOpen(false);
                                    }}
                                    type="button"
                                >
                                    <Bell className="size-5" />
                                    {intUnreadNotifications > 0 ? (
                                        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#ff8a1f] px-1 text-[10px] font-black text-white">
                                            {intUnreadNotifications > 9
                                                ? '9+'
                                                : intUnreadNotifications}
                                        </span>
                                    ) : null}
                                </button>
                                {blnNotificationsOpen ? (
                                    <NotificationPanel
                                        onClose={() => setBlnNotificationsOpen(false)}
                                    />
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    aria-expanded={blnAccountOpen}
                                    aria-label="Account"
                                    className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-[#073b82] transition hover:bg-[#eaf6ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                    onClick={() =>
                                    {
                                        setBlnAccountOpen((blnCurrent) => !blnCurrent);
                                        setBlnNotificationsOpen(false);
                                    }}
                                    type="button"
                                >
                                    <UserAvatar
                                        className="size-8 text-[11px]"
                                        strInitials={objUser.initials}
                                        strPhotoDataUrl={objProfile?.photoDataUrl}
                                    />
                                    <ChevronDown className="size-4" />
                                </button>

                                {blnAccountOpen ? (
                                    <AccountDropdown
                                        key={intProfileRevision}
                                        onNavigate={() => setBlnAccountOpen(false)}
                                        onSignOut={_handleSignOut}
                                        objProfile={objProfile}
                                        strProgram={strActiveProgram}
                                        objUser={objUser}
                                    />
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                className="rounded-lg border-2 border-[#2563eb] bg-white px-4 py-2 text-sm font-bold text-[#1d4ed8] shadow-sm shadow-blue-700/10 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                to="/login"
                            >
                                Sign In
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 lg:hidden">
                    {blnIsProponent ? (
                        <>
                            <div className="relative">
                                <button
                                    aria-expanded={blnNotificationsOpen}
                                    aria-label="Notifications"
                                    className="relative inline-flex size-10 items-center justify-center rounded-lg text-[#073b82] transition hover:bg-[#eaf6ff]"
                                    onClick={() =>
                                    {
                                        setBlnNotificationsOpen((blnCurrent) => !blnCurrent);
                                        setBlnAccountOpen(false);
                                    }}
                                    type="button"
                                >
                                    <Bell className="size-5" />
                                    {intUnreadNotifications > 0 ? (
                                        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#ff8a1f] px-1 text-[10px] font-black text-white">
                                            {intUnreadNotifications > 9
                                                ? '9+'
                                                : intUnreadNotifications}
                                        </span>
                                    ) : null}
                                </button>
                                {blnNotificationsOpen ? (
                                    <NotificationPanel
                                        onClose={() => setBlnNotificationsOpen(false)}
                                    />
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    aria-expanded={blnAccountOpen}
                                    aria-label="Account"
                                    className="inline-flex size-10 items-center justify-center rounded-lg text-[#073b82] transition hover:bg-[#eaf6ff]"
                                    onClick={() =>
                                    {
                                        setBlnAccountOpen((blnCurrent) => !blnCurrent);
                                        setBlnNotificationsOpen(false);
                                    }}
                                    type="button"
                                >
                                    <UserAvatar
                                        className="size-8 text-[11px]"
                                        strInitials={objUser.initials}
                                        strPhotoDataUrl={objProfile?.photoDataUrl}
                                    />
                                </button>

                                {blnAccountOpen ? (
                                    <AccountDropdown
                                        key={intProfileRevision}
                                        onNavigate={() => setBlnAccountOpen(false)}
                                        onSignOut={_handleSignOut}
                                        objProfile={objProfile}
                                        strProgram={strActiveProgram}
                                        objUser={objUser}
                                    />
                                ) : null}
                            </div>
                        </>
                    ) : null}

                    <button
                        aria-label="Menu"
                        className="rounded-md p-2 text-[#073b82] transition-colors hover:bg-[#eaf6ff]"
                        onClick={() => setBlnOpen((blnCurrent) => !blnCurrent)}
                        type="button"
                    >
                        {blnOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {blnOpen ? (
                <div className="border-t border-[#d6e9f8] bg-white lg:hidden">
                    <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
                        {arrNavigationItems.map((objItem) =>
                            objItem.label === 'Programs' ? (
                                <div className="rounded-md px-3 py-2" key={objItem.label}>
                                    <p className="py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                        Programs
                                    </p>
                                    <div className="mt-1 grid gap-1">
                                        {PROGRAM_OPTIONS.map((objProgram) => (
                                            <Link
                                                className={`rounded-md px-3 py-2.5 text-sm font-bold ${objLocation.pathname === objProgram.href
                                                    ? 'bg-[#eaf6ff] text-[#073b82]'
                                                    : 'text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]'
                                                    }`}
                                                key={objProgram.href}
                                                onClick={() => setBlnOpen(false)}
                                                to={objProgram.href}
                                            >
                                                {objProgram.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    className={`rounded-md px-3 py-3 text-sm font-bold ${_isNavigationItemActive(objItem)
                                        ? 'bg-[#eaf6ff] text-[#073b82]'
                                        : 'text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]'
                                        }`}
                                    to={objItem.href}
                                    key={objItem.href}
                                    onClick={() =>
                                    {
                                        setBlnOpen(false);
                                        _handleNavClick(objItem);
                                    }}
                                >
                                    {objItem.label}
                                </Link>
                            ),
                        )}
                        {blnIsProponent ? (
                            <button
                                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-[#073b82]"
                                onClick={() =>
                                {
                                    setBlnOpen(false);
                                    _handleSignOut();
                                }}
                                type="button"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        ) : (
                            <div className="mt-2 grid gap-2">
                                <Link
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#073b82] px-4 py-3 text-sm font-bold text-white"
                                    onClick={() => setBlnOpen(false)}
                                    to="/login"
                                >
                                    Track Proposal
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    className="inline-flex items-center justify-center rounded-lg border-2 border-[#2563eb] bg-white px-4 py-3 text-sm font-bold text-[#1d4ed8] shadow-sm shadow-blue-700/10"
                                    onClick={() => setBlnOpen(false)}
                                    to="/login"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            ) : null}
        </header>
    ); // end return
} /* end SiteHeader */

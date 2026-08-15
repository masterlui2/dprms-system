import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  FilePenLine,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ReceiptText,
  User,
  Activity,
  X,
} from "lucide-react";

import { NotificationPanel } from "../admin/NotificationPanel";
import logoImage from "../../assets/logo2.png";
import { type MockUser, clearMockUser, getMockUser } from "../../lib/mockAuth";
import {
  getProponentProfile,
  PROFILE_UPDATED_EVENT,
  type ProponentProfile,
} from "../../services/profileStore";

function getProgramHomePath(pathname: string, user?: MockUser | null) {
  if (pathname.startsWith("/programs/gia")) return "/programs/gia";
  if (pathname.startsWith("/programs/setup")) return "/programs/setup";
  if (user?.program === "GIA") return "/programs/gia";
  if (user?.program === "SETUP") return "/programs/setup";

  return "/";
}

function getNavigationItems(pathname: string, user?: MockUser | null) {
  const homeHref = getProgramHomePath(pathname, user);
  const isProgramContext =
    homeHref === "/programs/gia" || homeHref === "/programs/setup";

  return [
    { label: "Home", href: homeHref },
    { label: "Programs", href: "/#programs" },
    {
      label: "How to Apply",
      href: isProgramContext ? `${homeHref}#process` : "/#process",
    },
    {
      label: "Requirements",
      href: isProgramContext ? `${homeHref}#requirements` : "/#requirements",
    },
    { label: "Track Proposal", href: "/login" },
    { label: "FAQs", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ];
}

const programOptions = [
  { label: "GIA", href: "/programs/gia" },
  { label: "SETUP", href: "/programs/setup" },
];

function TopBar() {
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

function Logo({ homeHref }: { homeHref: string }) {
  return (
    <Link
      className="flex min-w-0 items-center gap-3"
      to={homeHref}
      aria-label="DOST GIA and SETUP Portal home"
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
  );
}

function UserAvatar({
  className,
  initials,
  photoDataUrl,
}: {
  className: string;
  initials: string;
  photoDataUrl?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#073b82] font-black text-white ${className}`}
    >
      {photoDataUrl ? (
        <img alt="" className="h-full w-full object-cover" src={photoDataUrl} />
      ) : (
        initials
      )}
    </span>
  );
}

function AccountDropdown({
  onNavigate,
  onSignOut,
  profile,
  user,
}: {
  onNavigate: () => void;
  onSignOut: () => void;
  profile: ProponentProfile | null;
  user: MockUser;
}) {
  const isProponent = user.role === "proponent";
  const isGia = user.program === "GIA";
  const programPrefix = isGia ? "/gia" : "/setup";
  const displayName = profile?.fullName || user.name;
  const moduleItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      to: `${programPrefix}/dashboard`,
    },
    {
      icon: FilePenLine,
      label: isGia ? "My Proposal" : "My Application",
      to: isGia
        ? "/gia/dashboard/my-proposal"
        : "/setup/dashboard/my-application",
    },
    {
      icon: Activity,
      label: "Project Monitoring",
      to: `${programPrefix}/dashboard/project-monitoring`,
    },
    {
      icon: PackageCheck,
      label: isGia ? "Accomplishment Reports" : "Equipment",
      to: isGia
        ? `${programPrefix}/dashboard/accomplishment-reports`
        : `${programPrefix}/dashboard/equipment`,
    },
    {
      icon: ReceiptText,
      label: isGia ? "Disbursement Tracking" : "Repayment / Billing",
      to: `${programPrefix}/dashboard/finance`,
    },
    {
      icon: Bell,
      label: "Notifications",
      to: `${programPrefix}/dashboard/notifications`,
    },
    { icon: User, label: "Profile", to: `${programPrefix}/dashboard/profile` },
  ];

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-2xl">
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            className="size-11 text-sm"
            initials={user.initials}
            photoDataUrl={profile?.photoDataUrl}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-900">
              {displayName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      {isProponent ? (
        <div className="px-2 py-2">
          <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"></p>
          <div className="grid gap-1">
            {moduleItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82]"
                  key={item.to}
                  onClick={onNavigate}
                  to={item.to}
                >
                  <Icon className="size-4 text-[#0f53b7]" />
                  <span>{item.label}</span>
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
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getMockUser();
  const [open, setOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const isProponent = user?.role === "proponent";
  const [profile, setProfile] = useState<ProponentProfile | null>(null);
  const navigationItems = getNavigationItems(location.pathname, user);
  const programsActive =
    location.pathname.startsWith("/programs/gia") ||
    location.pathname.startsWith("/programs/setup");

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfile(null);
      return;
    }
    getProponentProfile(user).then((result) => {
      if (!cancelled) setProfile(result);
    });
    return () => {
      cancelled = true;
    };
    // NOTE: depends on user?.email (a primitive), not the `user` object
    // itself. getMockUser() re-parses localStorage on every call and
    // returns a brand-new object reference each time, even when nothing
    // has actually changed. Using `user` directly here made React treat
    // the dependency as "changed" on every single render, which re-ran
    // this effect every time, which called setProfile on resolve, which
    // triggered a re-render, which called getMockUser() again... an
    // infinite effect loop that froze the tab (see the "SiteHeader.tsx:251"
    // stack trace investigation). Do not swap this back to `user` without
    // also fixing getMockUser() to return a stable/memoized reference.
  }, [user?.email, profileRevision]);

  useEffect(() => {
    const refreshProfile = () => setProfileRevision((current) => current + 1);
    window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
  }, []);

  function handleSignOut() {
    clearMockUser();
    setAccountOpen(false);
    setNotificationsOpen(false);
    setProgramsOpen(false);
    navigate("/login");
  }

  function isActive(href: string) {
    const [targetPath, targetHash] = href.split("#");

    if (targetHash) {
      return (
        location.pathname === targetPath && location.hash === `#${targetHash}`
      );
    }
    return location.pathname === targetPath && !location.hash;
  }

  function isNavigationItemActive(item: { label: string; href: string }) {
    if (item.label === "Home") {
      return location.pathname === "/" && !location.hash;
    }
    if (item.label === "Programs") {
      return (
        programsActive ||
        (location.pathname === "/" && location.hash === "#programs")
      );
    }
    return isActive(item.href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6e9f8] bg-white">
      <TopBar />

      <div className="flex w-full items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-[72px] xl:px-[72px]">
        <div className="min-w-[120px] xl:min-w-[360px]">
          <Logo homeHref="/" />
        </div>

        <nav
          className="hidden flex-1 -translate-x-4 items-center justify-center gap-1 lg:flex xl:-translate-x-14"
          aria-label="Primary navigation"
        >
          {navigationItems.map((item) =>
            item.label === "Programs" ? (
              <div
                className="relative"
                key={item.label}
                onBlur={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    setProgramsOpen(false);
                  }
                }}
                onFocus={() => setProgramsOpen(true)}
                onMouseEnter={() => setProgramsOpen(true)}
                onMouseLeave={() => setProgramsOpen(false)}
              >
                <button
                  aria-expanded={programsOpen}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                    isNavigationItemActive(item)
                      ? "bg-[#eaf6ff] text-[#073b82]"
                      : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                  }`}
                  onClick={() => setProgramsOpen((current) => !current)}
                  type="button"
                >
                  Programs
                  <ChevronDown
                    className={`size-4 transition-transform ${
                      programsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {programsOpen ? (
                  <div className="absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-2">
                    <div className="overflow-hidden rounded-lg border border-[#d8e1ee] bg-white p-1 shadow-xl">
                      {programOptions.map((program) => (
                        <Link
                          className={`block rounded-md px-3 py-2.5 text-sm font-bold transition ${
                            location.pathname === program.href
                              ? "bg-[#eaf6ff] text-[#073b82]"
                              : "text-slate-700 hover:bg-[#f3f8fe] hover:text-[#073b82]"
                          }`}
                          key={program.href}
                          onClick={() => {
                            setProgramsOpen(false);
                            setOpen(false);
                          }}
                          to={program.href}
                        >
                          {program.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                  isNavigationItemActive(item)
                    ? "bg-[#eaf6ff] text-[#073b82]"
                    : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                }`}
                to={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden min-w-[90px] items-center justify-end gap-2 lg:flex">
          {isProponent ? (
            <>
              <div className="relative">
                <button
                  aria-expanded={notificationsOpen}
                  aria-label="Notifications"
                  className="relative inline-flex size-10 items-center justify-center rounded-lg text-[#073b82] transition hover:bg-[#eaf6ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    setAccountOpen(false);
                  }}
                  type="button"
                >
                  <Bell className="size-5" />
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#ff8a1f]" />
                </button>
                {notificationsOpen ? (
                  <NotificationPanel
                    onClose={() => setNotificationsOpen(false)}
                    role="proponent"
                  />
                ) : null}
              </div>

              <div className="relative">
                <button
                  aria-expanded={accountOpen}
                  aria-label="Account"
                  className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-[#073b82] transition hover:bg-[#eaf6ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  onClick={() => {
                    setAccountOpen((current) => !current);
                    setNotificationsOpen(false);
                  }}
                  type="button"
                >
                  <UserAvatar
                    className="size-8 text-[11px]"
                    initials={user.initials}
                    photoDataUrl={profile?.photoDataUrl}
                  />
                  <ChevronDown className="size-4" />
                </button>

                {accountOpen ? (
                  <AccountDropdown
                    key={profileRevision}
                    onNavigate={() => setAccountOpen(false)}
                    onSignOut={handleSignOut}
                    profile={profile}
                    user={user}
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
          {isProponent ? (
            <>
              <div className="relative">
                <button
                  aria-expanded={notificationsOpen}
                  aria-label="Notifications"
                  className="relative inline-flex size-10 items-center justify-center rounded-lg text-[#073b82] transition hover:bg-[#eaf6ff]"
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    setAccountOpen(false);
                  }}
                  type="button"
                >
                  <Bell className="size-5" />
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#ff8a1f]" />
                </button>
                {notificationsOpen ? (
                  <NotificationPanel
                    onClose={() => setNotificationsOpen(false)}
                    role="proponent"
                  />
                ) : null}
              </div>

              <div className="relative">
                <button
                  aria-expanded={accountOpen}
                  aria-label="Account"
                  className="inline-flex size-10 items-center justify-center rounded-lg text-[#073b82] transition hover:bg-[#eaf6ff]"
                  onClick={() => {
                    setAccountOpen((current) => !current);
                    setNotificationsOpen(false);
                  }}
                  type="button"
                >
                  <UserAvatar
                    className="size-8 text-[11px]"
                    initials={user.initials}
                    photoDataUrl={profile?.photoDataUrl}
                  />
                </button>

                {accountOpen ? (
                  <AccountDropdown
                    key={profileRevision}
                    onNavigate={() => setAccountOpen(false)}
                    onSignOut={handleSignOut}
                    profile={profile}
                    user={user}
                  />
                ) : null}
              </div>
            </>
          ) : null}

          <button
            aria-label="Menu"
            className="rounded-md p-2 text-[#073b82] transition-colors hover:bg-[#eaf6ff]"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#d6e9f8] bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navigationItems.map((item) =>
              item.label === "Programs" ? (
                <div className="rounded-md px-3 py-2" key={item.label}>
                  <p className="py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Programs
                  </p>
                  <div className="mt-1 grid gap-1">
                    {programOptions.map((program) => (
                      <Link
                        className={`rounded-md px-3 py-2.5 text-sm font-bold ${
                          location.pathname === program.href
                            ? "bg-[#eaf6ff] text-[#073b82]"
                            : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                        }`}
                        key={program.href}
                        onClick={() => setOpen(false)}
                        to={program.href}
                      >
                        {program.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  className={`rounded-md px-3 py-3 text-sm font-bold ${
                    isNavigationItemActive(item)
                      ? "bg-[#eaf6ff] text-[#073b82]"
                      : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                  }`}
                  to={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
            {isProponent ? (
              <button
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-[#073b82]"
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
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
                  onClick={() => setOpen(false)}
                  to="/login"
                >
                  Track Proposal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#2563eb] bg-white px-4 py-3 text-sm font-bold text-[#1d4ed8] shadow-sm shadow-blue-700/10"
                  onClick={() => setOpen(false)}
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
  );
}

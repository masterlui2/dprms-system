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
} from "../../services/profileStore";

function getHomePath(user?: MockUser | null) {
  if (user?.program === "GIA") return "/programs/gia";
  if (user?.program === "SETUP") return "/programs/setup";

  return "/";
}

function getProgramSectionPath(pathname: string, user?: MockUser | null) {
  if (pathname.startsWith("/programs/gia")) return "/programs/gia";
  if (pathname.startsWith("/programs/setup")) return "/programs/setup";
  return getHomePath(user);
}

function getNavigationItems(pathname: string, user?: MockUser | null) {
  const homeHref = getHomePath(user);
  const sectionHref = getProgramSectionPath(pathname, user);
  const isProgramContext =
    sectionHref === "/programs/gia" || sectionHref === "/programs/setup";

  return [
    { label: "Home", href: homeHref },
    {
      label: "How to Apply",
      href: isProgramContext ? `${sectionHref}#process` : "/#process",
    },
    {
      label: "Requirements",
      href: isProgramContext ? `${sectionHref}#requirements` : "/#requirements",
    },
    { label: "Track Proposal", href: "/login" },
    { label: "FAQs", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ];
}

const programOptions = [
  { label: "GIA", href: "/programs/gia", badge: "G" },
  { label: "SETUP", href: "/programs/setup", badge: "S" },
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
        className="h-11 w-auto shrink-0 object-contain sm:h-12"
        src={logoImage}
      />
      <span className="hidden max-w-[300px] leading-tight sm:block">
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
  user,
}: {
  onNavigate: () => void;
  onSignOut: () => void;
  user: MockUser;
}) {
  const isProponent = user.role === "proponent";
  const profile = getProponentProfile(user);
  const moduleItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    {
      icon: FilePenLine,
      label: "My Proposals",
      to: "/dashboard/my-application",
    },

    { icon: PackageCheck, label: "Equipment", to: "/dashboard/equipment" },
    user.program === "GIA"
      ? { icon: Activity, label: "Milestones", to: "/dashboard/milestones" }
      : {
          icon: ReceiptText,
          label: "Repayment / Billing",
          to: "/dashboard/finance",
        },
    { icon: User, label: "Profile", to: "/dashboard/profile" },
  ];

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-2xl">
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            className="size-11 text-sm"
            initials={user.initials}
            photoDataUrl={profile.photoDataUrl}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-900">
              {profile.fullName}
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
  const profile = user ? getProponentProfile(user) : null;
  const homeHref = getHomePath(user);
  const navigationItems = getNavigationItems(location.pathname, user);

  useEffect(() => {
    const refreshProfile = () => setProfileRevision((current) => current + 1);
    window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
  }, []);

  function handleSignOut() {
    clearMockUser();
    setOpen(false);
    setProgramsOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);
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

  function isNavItemActive(item: { label: string; href: string }) {
    if (item.label === "Home" && item.href.startsWith("/programs/")) {
      return false;
    }

    return isActive(item.href);
  }

  function isProgramsActive() {
    return location.pathname.startsWith("/programs/") && !location.hash;
  }

  function closeMenus() {
    setOpen(false);
    setProgramsOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6e9f8] bg-white">
      <TopBar />

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8">
        <div className="min-w-0 justify-self-start">
          <Logo homeHref={homeHref} />
        </div>

        <nav
          className="hidden items-center justify-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {navigationItems.slice(0, 1).map((item) => (
            <Link
              className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                isActive(item.href)
                  ? "bg-[#eaf6ff] text-[#073b82]"
                  : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
              }`}
              to={item.href}
              key={item.href}
              onClick={() => setProgramsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="relative">
            <button
              aria-expanded={programsOpen}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                isProgramsActive()
                  ? "bg-[#eaf6ff] text-[#073b82]"
                  : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
              }`}
              onClick={() => {
                setProgramsOpen((current) => !current);
                setAccountOpen(false);
                setNotificationsOpen(false);
              }}
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
              <div className="absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-[#d8e1ee] bg-white p-1 shadow-xl">
                {programOptions.map((program) => (
                  <Link
                    className={`block rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                      location.pathname === program.href
                        ? "bg-[#eaf6ff] text-[#073b82]"
                        : "text-slate-700 hover:bg-[#f3f8fe] hover:text-[#073b82]"
                    }`}
                    key={program.href}
                    onClick={closeMenus}
                    to={program.href}
                  >
                    {program.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {navigationItems.slice(1).map((item) => (
            <Link
              className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                isActive(item.href)
                  ? "bg-[#eaf6ff] text-[#073b82]"
                  : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
              }`}
              to={item.href}
              key={item.href}
              onClick={() => setProgramsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-2 justify-self-end lg:flex">
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
                    setProgramsOpen(false);
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
                    setProgramsOpen(false);
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
                    onNavigate={closeMenus}
                    onSignOut={handleSignOut}
                    user={user}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link
                className="rounded-lg border border-[#d8e1ee] bg-white px-4 py-2 text-sm font-bold text-[#073b82] transition-colors hover:border-blue-300 hover:bg-blue-50"
                to="/login"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 justify-self-end lg:hidden">
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
                    setProgramsOpen(false);
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
                    setProgramsOpen(false);
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
                    onNavigate={closeMenus}
                    onSignOut={handleSignOut}
                    user={user}
                  />
                ) : null}
              </div>
            </>
          ) : null}

          <button
            aria-label="Menu"
            className="rounded-md p-2 text-[#073b82] transition-colors hover:bg-[#eaf6ff]"
            onClick={() => {
              setOpen((current) => !current);
              setProgramsOpen(false);
              setAccountOpen(false);
              setNotificationsOpen(false);
            }}
            type="button"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#d6e9f8] bg-white lg:hidden">
          <nav className="flex flex-col px-4 py-3 sm:px-6">
            {navigationItems.slice(0, 1).map((item) => (
              <Link
                className={`rounded-md px-3 py-3 text-sm font-bold ${
                  isActive(item.href)
                    ? "bg-[#eaf6ff] text-[#073b82]"
                    : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                }`}
                to={item.href}
                key={item.href}
                onClick={closeMenus}
              >
                {item.label}
              </Link>
            ))}

            <button
              aria-expanded={programsOpen}
              className={`inline-flex items-center justify-between rounded-md px-3 py-3 text-sm font-bold ${
                isProgramsActive()
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
              <div className="mb-1 ml-3 grid gap-1 border-l border-[#d8e1ee] pl-3">
                {programOptions.map((program) => (
                  <Link
                    className={`rounded-md px-3 py-2.5 text-sm font-bold ${
                      location.pathname === program.href
                        ? "bg-[#eaf6ff] text-[#073b82]"
                        : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                    }`}
                    key={program.href}
                    onClick={closeMenus}
                    to={program.href}
                  >
                    {program.label}
                  </Link>
                ))}
              </div>
            ) : null}

            {navigationItems.slice(1).map((item) => (
              <Link
                className={`rounded-md px-3 py-3 text-sm font-bold ${
                  isActive(item.href)
                    ? "bg-[#eaf6ff] text-[#073b82]"
                    : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                }`}
                to={item.href}
                key={item.href}
                onClick={closeMenus}
              >
                {item.label}
              </Link>
            ))}

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
                  className="inline-flex items-center justify-center rounded-lg border border-[#d8e1ee] px-4 py-3 text-sm font-bold text-[#073b82]"
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

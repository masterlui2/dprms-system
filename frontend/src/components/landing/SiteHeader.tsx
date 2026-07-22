import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ReceiptText,
  User,
  UserCircle2,
  Activity,
  X,
} from "lucide-react";

import { NotificationPanel } from "../admin/NotificationPanel";
import logoImage from "../../assets/logo2.png";
import {
  type MockUser,
  ROLE_LABEL,
  clearMockUser,
  getMockUser,
} from "../../lib/mockAuth";

function getProgramHomePath(pathname: string, user?: MockUser | null) {
  if (pathname.startsWith("/programs/gia")) return "/programs/gia";
  if (pathname.startsWith("/programs/setup")) return "/programs/setup";
  if (user?.program === "GIA") return "/programs/gia";
  if (user?.program === "SETUP") return "/programs/setup";

  return "/";
}

function getNavigationItems(pathname: string, user?: MockUser | null) {
  const homeHref = getProgramHomePath(pathname, user);
  const isProgramPage =
    pathname.startsWith("/programs/gia") || pathname.startsWith("/programs/setup");

  return [
    { label: "Home", href: homeHref },
    { label: "Programs", href: "/#programs" },
    {
      label: "How to Apply",
      href: isProgramPage ? `${pathname}#process` : "/#process",
    },
    {
      label: "Requirements",
      href: isProgramPage ? `${pathname}#requirements` : "/#programs",
    },
    { label: "Track Proposal", href: "/login" },
    { label: "FAQs", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ];
}

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
        <span className="mt-0.5 block text-xs font-semibold text-slate-500">
          For GIA and SETUP Programs
        </span>
      </span>
    </Link>
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
  const programLabel = user.program ? `${user.program} Portal` : "DOST Portal";
  const isProponent = user.role === "proponent" || user.role === "applicant";
  const moduleItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: FilePenLine, label: "My Proposals", to: "/dashboard/my-application" },
    { icon: FileCheck2, label: "Documentary Requirements", to: "/dashboard/documents" },
    { icon: ClipboardCheck, label: "Application Status", to: "/dashboard/application-status" },
    { icon: Activity, label: "Project Monitoring", to: "/dashboard/project-monitoring" },
    { icon: PackageCheck, label: "Equipment", to: "/dashboard/equipment" },
    { icon: ReceiptText, label: "Repayment / Billing", to: "/dashboard/finance" },
    { icon: Bell, label: "Notifications", to: "/dashboard/notifications" },
    { icon: User, label: "Profile", to: "/dashboard/profile" },
  ];

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-2xl">
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#073b82] text-sm font-black text-white">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-900">
              {user.name}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#0f53b7]">
          {ROLE_LABEL[user.role]}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-slate-100 bg-[#f8fbff] px-3 py-2">
            <p className="font-black text-slate-900">{programLabel}</p>
            <p className="mt-0.5 text-slate-500">Workspace</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-[#f8fbff] px-3 py-2">
            <p className="font-black text-slate-900">
              {user.applicationReference ?? "Active"}
            </p>
            <p className="mt-0.5 text-slate-500">
              {user.applicationReference ? "Reference" : "Session"}
            </p>
          </div>
        </div>
      </div>

      {isProponent ? (
        <div className="px-2 py-2">
          <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Modules
          </p>
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isProponent = user?.role === "proponent" || user?.role === "applicant";
  const homeHref = getProgramHomePath(location.pathname, user);
  const navigationItems = getNavigationItems(location.pathname, user);

  function handleSignOut() {
    clearMockUser();
    setAccountOpen(false);
    setNotificationsOpen(false);
    navigate("/login");
  }

  function isActive(href: string) {
    const [targetPath, targetHash] = href.split("#");

    if (href === "/") return location.pathname === "/" && !location.hash;
    if (href === "/programs/gia" || href === "/programs/setup") {
      return location.pathname.startsWith(href) && !targetHash;
    }
    if (href === "/#programs" && location.pathname.startsWith("/programs")) {
      return true;
    }
    if (targetHash) {
      return (
        location.pathname === targetPath &&
        location.hash === `#${targetHash}`
      );
    }
    return location.pathname === targetPath;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6e9f8] bg-white">
      <TopBar />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-[120px] xl:min-w-[360px]">
          <Logo homeHref={homeHref} />
        </div>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {navigationItems.map((item) => (
            <Link
              className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                isActive(item.href)
                  ? "bg-[#eaf6ff] text-[#073b82]"
                  : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
              }`}
              to={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
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
                  <UserCircle2 className="size-7" />
                  <ChevronDown className="size-4" />
                </button>

                {accountOpen ? (
                  <AccountDropdown
                    onNavigate={() => setAccountOpen(false)}
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
                  <UserCircle2 className="size-7" />
                </button>

                {accountOpen ? (
                  <AccountDropdown
                    onNavigate={() => setAccountOpen(false)}
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
            {navigationItems.map((item) => (
              <Link
                className={`rounded-md px-3 py-3 text-sm font-bold ${
                  isActive(item.href)
                    ? "bg-[#eaf6ff] text-[#073b82]"
                    : "text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                }`}
                to={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
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

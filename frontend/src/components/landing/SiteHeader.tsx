import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";

import { NotificationPanel } from "../admin/NotificationPanel";
import logoImage from "../../assets/logo2.png";
import { navigationItems } from "../../data/landing";
import {
  type MockUser,
  ROLE_LABEL,
  clearMockUser,
  getMockUser,
} from "../../lib/mockAuth";

const proponentModules = [
  {
    description: "Create a new assistance request",
    icon: FileText,
    label: "Submit proposal",
    to: "/proposal",
  },
  {
    description: "Track review and revision status",
    icon: ClipboardList,
    label: "My proposals",
    to: "#process",
  },
  {
    description: "Check forms and upload requirements",
    icon: FileCheck2,
    label: "Documents",
    to: "#programs",
  },
  {
    description: "View field validation schedule",
    icon: CalendarDays,
    label: "Site visit schedule",
    to: "#contact",
  },
];

function TopBar() {
  return (
    <div className="bg-[#073b82] text-xs text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-[#f4c542]" />
          Republic of the Philippines - Department of Science and Technology
        </span>
        <span className="hidden font-semibold text-white/80 sm:inline">
          An official DOST digital service
        </span>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <a
      className="flex items-center"
      href="#home"
      aria-label="DOST MSME Monitoring Portal home"
    >
      <img
        alt="DOST MSME Monitoring Portal"
        className="h-14 w-auto max-w-[240px] object-contain sm:h-20"
        src={logoImage}
      />
    </a>
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
  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-2xl">
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
      </div>

      <div className="px-2 py-2">
        <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
          My workspace
        </p>
        <div className="grid gap-1">
          {proponentModules.map(({ description, icon: Icon, label, to }) => {
            const isRoute = to.startsWith("/");
            const className =
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f3f8fe]";
            const content = (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-900">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {description}
                  </span>
                </span>
              </>
            );

            return isRoute ? (
              <Link
                className={className}
                key={label}
                onClick={onNavigate}
                to={to}
              >
                {content}
              </Link>
            ) : (
              <a className={className} href={to} key={label} onClick={onNavigate}>
                {content}
              </a>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1 border-t border-slate-100 px-2 py-2">
        <a
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82]"
          href="#contact"
          onClick={onNavigate}
        >
          <HelpCircle className="size-4 text-[#0f53b7]" />
          Help and support
        </a>
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
  const user = getMockUser();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isProponent = user?.role === "proponent";

  function handleSignOut() {
    clearMockUser();
    setAccountOpen(false);
    setNotificationsOpen(false);
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6e9f8] bg-white/90 backdrop-blur-md">
      <TopBar />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-[210px]">
          <Logo />
        </div>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {navigationItems.map((item) => (
            <a
              className="rounded-md px-3.5 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-[#eaf6ff] hover:text-[#073b82]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden min-w-[210px] items-center justify-end gap-2 lg:flex">
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-[#073b82] transition-colors hover:bg-[#eaf6ff]"
                to="/login"
              >
                Sign In
              </Link>
              <Link
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#073b82] to-[#0f6ed6] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-transform hover:-translate-y-0.5"
                to="/login"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
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
              <a
                className="rounded-md px-3 py-3 text-sm font-bold text-slate-700 hover:bg-[#eaf6ff] hover:text-[#073b82]"
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
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
              <Link
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#073b82] px-4 py-3 text-sm font-bold text-white"
                onClick={() => setOpen(false)}
                to="/login"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

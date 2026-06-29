import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Brain,
  ClipboardCheck,
  FileUp,
  LayoutDashboard,
  LogOut,
  QrCode,
  Wallet,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import logoImage from "../../assets/logo.png";
import { ROLE_LABEL, clearMockUser, type MockUser } from "../../lib/mockAuth";
import { cn } from "../../utils/cn";

type Role = MockUser["role"];

type Item = {
  enabled?: boolean;
  icon: LucideIcon;
  roles: Role[];
  title: string;
  url: string;
};

const ITEMS: Item[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
    enabled: true,
  },
  {
    title: "Approval Workflow",
    url: "/dashboard/approvals",
    icon: ClipboardCheck,
    roles: ["admin"],
  },
  {
    title: "Budget Tracking",
    url: "/dashboard/budget",
    icon: Wallet,
    roles: ["admin"],
  },
  {
    title: "Project Monitoring",
    url: "/dashboard/monitoring",
    icon: Activity,
    roles: ["admin"],
  },
  {
    title: "QR Code Inventory",
    url: "/dashboard/inventory",
    icon: QrCode,
    roles: ["admin"],
  },
  {
    title: "Reports & Analytics",
    url: "/dashboard/reports",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    title: "Predictive Analytics",
    url: "/dashboard/predictive",
    icon: Brain,
    roles: ["admin"],
  },
];

function SidebarItem({
  collapsed,
  isActive,
  item,
}: {
  collapsed: boolean;
  isActive: boolean;
  item: Item;
}) {
  const className = cn(
    "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
    collapsed && "justify-center px-0",
    isActive
      ? "bg-white text-[#073b82] shadow-sm ring-1 ring-[#d7e5f5]"
      : "text-slate-700 hover:bg-white/75 hover:text-[#073b82]",
    !item.enabled &&
      "cursor-default opacity-55 hover:bg-transparent hover:text-slate-700",
  );

  const content = (
    <>
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </>
  );

  if (!item.enabled) {
    return (
      <button
        aria-disabled
        className={className}
        disabled
        title={item.title}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink className={className} title={item.title} to={item.url}>
      {content}
    </NavLink>
  );
}

export function AdminSidebar({
  collapsed = false,
  user,
}: {
  collapsed?: boolean;
  user: MockUser;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const visible = ITEMS.filter((item) => item.roles.includes(user.role));
  const isActive = (url: string) =>
    url === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(url);

  function handleSignOut() {
    clearMockUser();
    navigate("/login");
  }

  return (
    <aside className="border-r border-[#d8e1ee] bg-[#f7fbff] lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-full flex-col">
        <div className="border-b border-[#d8e1ee] px-4 py-4">
          <NavLink
            className={cn(
              "flex items-center gap-3 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
              collapsed && "justify-center px-0",
            )}
            title="DOST MSME Portal"
            to="/dashboard"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-[#d8e1ee]">
              <img
                alt="DOST XI"
                className="h-9 w-9 object-contain"
                src={logoImage}
              />
            </span>

            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block text-lg font-extrabold text-[#073b82]">
                  DOST
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  MSME Portal
                </span>
              </span>
            )}
          </NavLink>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Modules
            </p>
          )}

          <nav className="space-y-1">
            {visible.map((item) => (
              <SidebarItem
                collapsed={collapsed}
                isActive={isActive(item.url)}
                item={item}
                key={item.url}
              />
            ))}
          </nav>
        </div>

        <div className="border-t border-[#d8e1ee] bg-white px-3 py-4">
          {!collapsed && (
            <div className="px-2 pb-3">
              <div className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </div>
              <div className="truncate text-[11px] text-slate-500">
                {ROLE_LABEL[user.role]}
              </div>
            </div>
          )}

          <button
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f3f8fe] hover:text-[#073b82] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
              collapsed && "justify-center px-0",
            )}
            onClick={handleSignOut}
            title="Sign out"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

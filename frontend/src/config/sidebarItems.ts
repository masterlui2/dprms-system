import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  DatabaseBackup,
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  MapPinned,
  PackageCheck,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import {
  canAccessModule,
  modulePermissions,
  type ModuleId,
  type UserRole,
} from "./permissions";

export type SidebarSubItem = {
  id: ModuleId;
  label: string;
  route: string;
  icon?: LucideIcon;
};

/** One menu record per internal DPRMS module. Shared roles use the same record. */
export type SidebarItem = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  route: string;
  allowedRoles: readonly UserRole[];
  subItems?: SidebarSubItem[];
};

const item = (
  id: ModuleId,
  label: string,
  icon: LucideIcon,
  route: string,
  subItems?: SidebarSubItem[],
): SidebarItem => ({
  id,
  label,
  icon,
  route,
  allowedRoles: modulePermissions[id],
  subItems,
});

export const sidebarItems: SidebarItem[] = [
  item("dashboard", "Dashboard", LayoutDashboard, "/dashboard"),

  item("applications", "Applications", FilePenLine, "/dashboard/applications"),
  item(
    "equipmentTracking",
    "Equipment & QR",
    PackageCheck,
    "/dashboard/equipment-tracking",
  ),
  item(
    "repaymentMonitoring",
    "Financial Records",
    ReceiptText,
    "/dashboard/repayment-monitoring",
  ),

  item(
    "projectMonitoring",
    "Project Monitoring",
    Activity,
    "/dashboard/project-monitoring",
    [
      {
        id: "projectMonitoring",
        label: "Overview",
        route: "/dashboard/project-monitoring?view=overview",
      },
      {
        id: "projectMonitoring",
        label: "Monitored Projects",
        route: "/dashboard/project-monitoring?view=projects",
      },
    ],
  ),
  item("projects", "Projects", FolderKanban, "/dashboard/projects"),
  item(
    "regionalMonitoring",
    "Regional Monitoring",
    Activity,
    "/dashboard/regional-monitoring",
  ),
  item("reports", "Reports", BarChart3, "/dashboard/reports"),

  item("userManagement", "User Management", Users, "/dashboard/users"),
  item("roleManagement", "Role Management", ShieldCheck, "/dashboard/roles"),
  item(
    "programManagement",
    "Program Management",
    Building2,
    "/dashboard/programs",
  ),
  item(
    "municipalityManagement",
    "Municipality Management",
    MapPinned,
    "/dashboard/municipalities",
  ),
  item(
    "budgetCategories",
    "Budget Categories",
    Wallet,
    "/dashboard/budget-categories",
  ),
  item(
    "notificationManagement",
    "Notification Management",
    Bell,
    "/dashboard/notification-management",
  ),
  item("auditLogs", "Audit Logs", ScrollText, "/dashboard/audit-logs"),
  item("backup", "Backup", DatabaseBackup, "/dashboard/backup"),
  item(
    "systemSettings",
    "System Settings",
    Settings,
    "/dashboard/system-settings",
  ),
];

const sidebarOrderByRole: Record<UserRole, ModuleId[]> = {
  system_admin: [
    "dashboard",
    "userManagement",
    "roleManagement",
    "programManagement",
    "municipalityManagement",
    "budgetCategories",
    "notificationManagement",
    "auditLogs",
    "backup",
    "systemSettings",
  ],
  project_staff: [
    "dashboard",
    "applications",
    "equipmentTracking",
    "reports",
  ],
  focal: [
    "dashboard",
    "applications",
    "projectMonitoring",
    "repaymentMonitoring",
    "reports",
  ],
  provincial_director: [
    "dashboard",
    "applications",
    "repaymentMonitoring",
    "projects",
    "reports",
  ],
  rpmo: [
    "dashboard",
    "applications",
    "regionalMonitoring",
    "reports",
  ],
  proponent: [],
};

export function getSidebarItems(role: UserRole) {
  const order = sidebarOrderByRole[role];
  return sidebarItems
    .filter(
      (sidebarItem) =>
        order.includes(sidebarItem.id) &&
        canAccessModule(role, sidebarItem.id),
    )
    .sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id));
}

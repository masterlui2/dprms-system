import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
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

/** One menu record per internal DPRMS module. Shared roles use the same record. */
export type SidebarItem = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  route: string;
  allowedRoles: readonly UserRole[];
};

const item = (
  id: ModuleId,
  label: string,
  icon: LucideIcon,
  route: string,
): SidebarItem => ({
  id,
  label,
  icon,
  route,
  allowedRoles: modulePermissions[id],
});

export const sidebarItems: SidebarItem[] = [
  item("dashboard", "Dashboard", LayoutDashboard, "/dashboard"),

  item("applications", "Data Entry", FilePenLine, "/dashboard/applications"),
  item(
    "projectManagement",
    "Project Monitoring",
    FolderKanban,
    "/dashboard/project-management",
  ),
  item(
    "budgetManagement",
    "Budget Management",
    Wallet,
    "/dashboard/budget-management",
  ),
  item(
    "equipmentTracking",
    "Equipment & QR",
    PackageCheck,
    "/dashboard/equipment-tracking",
  ),
  item(
    "repaymentMonitoring",
    "Finance Records",
    ReceiptText,
    "/dashboard/repayment-monitoring",
  ),

  item(
    "applicationReview",
    "Review",
    ClipboardCheck,
    "/dashboard/application-review",
  ),
  item(
    "technicalEvaluation",
    "Technical Evaluation",
    ShieldCheck,
    "/dashboard/technical-evaluation",
  ),
  item(
    "projectMonitoring",
    "Monitoring",
    Activity,
    "/dashboard/project-monitoring",
  ),
  item(
    "executiveApproval",
    "Final Approval",
    ShieldCheck,
    "/dashboard/executive-approval",
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
    "projectManagement",
    "reports",
  ],
  focal: [
    "dashboard",
    "applicationReview",
    "projectMonitoring",
    "repaymentMonitoring",
    "reports",
  ],
  provincial_director: [
    "dashboard",
    "executiveApproval",
    "repaymentMonitoring",
    "projects",
    "reports",
  ],
  rpmo: [
    "dashboard",
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

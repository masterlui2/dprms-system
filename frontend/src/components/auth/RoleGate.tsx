import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { getMockUser, type UserRole } from "../../lib/mockAuth";

export function RoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const user = getMockUser();

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

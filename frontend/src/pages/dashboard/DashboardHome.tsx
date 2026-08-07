import { ProponentDashboard } from "../proponent/ProponentDashboard";
import { getMockUser } from "../../lib/mockAuth";
import { ROLES } from '../../config/permissions';
import { InternalDashboard } from './InternalDashboard'

export function DashboardHome() {
  const user = getMockUser();

  if (user?.role === ROLES.PROPONENT) {
    return <ProponentDashboard />;
  }

  return <InternalDashboard role={user?.role ?? ROLES.SYSTEM_ADMIN} />;
}

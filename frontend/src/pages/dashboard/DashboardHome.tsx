import { AdminDashboard } from "../admin/AdminDashboard";
import { ProponentDashboard } from "../proponent/ProponentDashboard";
import { getMockUser } from "../../lib/mockAuth";

export function DashboardHome() {
  const user = getMockUser();

  if (user?.role !== "admin") {
    return <ProponentDashboard />;
  }

  return <AdminDashboard />;
}

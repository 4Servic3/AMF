import { getAdminContext, hasPermission } from "@/lib/auth/dal";
import { adminNavigationRegistry } from "@/config/admin-navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { redirect } from "next/navigation";
import "../admin-ui.css";
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAdminContext();
  const checks = await Promise.all(
    adminNavigationRegistry.map(async (item) => ({
      key: item.key,
      allowed: await hasPermission(
        item.permission === "AAL2" ? "dashboard.read" : item.permission,
      ),
    })),
  );
  const allowedKeys = checks
    .filter((item) => item.allowed)
    .map((item) => item.key);
  if (!allowedKeys.length) redirect("/admin/unauthorized");
  const name = user.user_metadata?.full_name || user.email || "Administrador";
  return (
    <AdminLayout name={name} allowedKeys={allowedKeys}>
      {children}
    </AdminLayout>
  );
}

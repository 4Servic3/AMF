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
  // Várias telas compartilham a mesma permissão: cada uma é consultada uma vez.
  const permissionOf = (permission: string) => (permission === "AAL2" ? "dashboard.read" : permission);
  const unique = [...new Set(adminNavigationRegistry.map((item) => permissionOf(item.permission)))];
  const granted = new Set(
    (await Promise.all(unique.map(async (key) => ((await hasPermission(key)) ? key : null)))).filter(Boolean),
  );
  const allowedKeys = adminNavigationRegistry
    .filter((item) => granted.has(permissionOf(item.permission)))
    .map((item) => item.key);
  if (!allowedKeys.length) redirect("/admin/unauthorized");
  const name = user.user_metadata?.full_name || user.email || "Administrador";
  return (
    <AdminLayout name={name} allowedKeys={allowedKeys}>
      {children}
    </AdminLayout>
  );
}

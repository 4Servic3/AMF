import { adminNavigationRegistry, type NavItem } from "@/config/admin-navigation";

export function isActiveRoute(pathname: string | null, route: string) {
  if (!pathname) return false;
  return pathname === route || (route !== "/admin" && pathname.startsWith(route + "/"));
}

export function currentNavItem(pathname: string | null): NavItem | undefined {
  return adminNavigationRegistry.find((item) => isActiveRoute(pathname, item.route));
}

/** Atalhos da barra de abas no celular, na ordem de prioridade do dia a dia. */
const TAB_PRIORITY = ["dashboard", "users", "courses", "communications", "support", "cases", "access"];

export function tabItems(allowedKeys: string[], limit = 4): NavItem[] {
  return TAB_PRIORITY.filter((key) => allowedKeys.includes(key))
    .slice(0, limit)
    .map((key) => adminNavigationRegistry.find((item) => item.key === key)!)
    .filter(Boolean);
}

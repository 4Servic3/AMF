import {
  adminNavigationRegistry,
  adminNavigationSections,
  type NavItem,
  type NavSection,
} from "@/config/admin-navigation";

export function isActiveRoute(pathname: string | null, route: string) {
  if (!pathname) return false;
  return pathname === route || (route !== "/admin" && pathname.startsWith(route + "/"));
}

export function currentNavItem(pathname: string | null): NavItem | undefined {
  return adminNavigationRegistry.find((item) => isActiveRoute(pathname, item.route));
}

export type VisibleSection = Omit<NavSection, "items"> & { route: string; items: NavItem[] };

/** Seções do menu que o administrador pode abrir, cada uma só com as abas permitidas. */
export function visibleSections(allowedKeys: string[]): VisibleSection[] {
  return adminNavigationSections.flatMap((section) => {
    const items = section.items
      .filter((key) => allowedKeys.includes(key))
      .map((key) => adminNavigationRegistry.find((item) => item.key === key)!)
      .filter(Boolean);
    return items.length ? [{ ...section, route: items[0].route, items }] : [];
  });
}

export function isActiveSection(pathname: string | null, section: VisibleSection) {
  return section.items.some((item) => isActiveRoute(pathname, item.route));
}

export function currentSection(pathname: string | null, allowedKeys: string[]) {
  return visibleSections(allowedKeys).find((section) => isActiveSection(pathname, section));
}

/** Atalhos da barra de abas no celular, na ordem de prioridade do dia a dia. */
const TAB_PRIORITY = ["dashboard", "students", "courses", "support", "communications", "cases"];

export function tabItems(allowedKeys: string[], limit = 4): VisibleSection[] {
  const sections = visibleSections(allowedKeys);
  return TAB_PRIORITY.map((key) => sections.find((section) => section.key === key))
    .filter((section): section is VisibleSection => !!section)
    .slice(0, limit);
}

import { describe, expect, it } from 'vitest';
import { adminNavigationRegistry, adminNavigationSections } from '@/config/admin-navigation';
import { currentSection, tabItems, visibleSections } from '@/components/admin/layout/nav-state';

const ALL = adminNavigationRegistry.map((item) => item.key);

describe('menu do admin por seções', () => {
  it('toda seção aponta só para telas existentes, e cada tela aparece no máximo uma vez', () => {
    const keys = adminNavigationSections.flatMap((section) => section.items);
    expect(keys.every((key) => ALL.includes(key))).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('com todas as permissões mostra 9 seções, sem a Academia', () => {
    const sections = visibleSections(ALL);
    expect(sections).toHaveLength(9);
    expect(sections.flatMap((section) => section.items.map((item) => item.key))).not.toContain('academy');
  });

  it('esconde abas sem permissão e usa a primeira aba permitida como destino', () => {
    const sales = visibleSections(['reports']).find((section) => section.key === 'sales')!;
    expect(sales.items.map((item) => item.key)).toEqual(['reports']);
    expect(sales.route).toBe('/admin/reports');
    expect(visibleSections([])).toEqual([]);
  });

  it('acha a seção pela aba aberta, inclusive em subpáginas', () => {
    expect(currentSection('/admin/access', ALL)?.key).toBe('students');
    expect(currentSection('/admin/users/123', ALL)?.key).toBe('students');
    expect(currentSection('/admin/audit', ALL)?.key).toBe('settings');
    expect(currentSection('/admin', ALL)?.key).toBe('dashboard');
  });

  it('barra do celular mostra Painel, Alunos, Cursos e Suporte', () => {
    expect(tabItems(ALL).map((section) => section.key)).toEqual(['dashboard', 'students', 'courses', 'support']);
  });
});

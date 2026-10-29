import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Clapperboard, 
  Stethoscope, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Key, 
  CreditCard, 
  LifeBuoy, 
  FolderOpen, 
  Award, 
  Bell, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  FileSearch,
  Activity,
  ShoppingBag,
  Home
} from 'lucide-react'

export type NavGroup = 'Painel' | 'Conteúdo' | 'Usuários' | 'Operação' | 'Governança'

export interface NavItem {
  key: string
  label: string
  route: string
  icon: any
  permission: string
  group: NavGroup
  /** Nome curto quando a tela aparece como aba dentro de uma seção do menu. */
  tab?: string
}

export const adminNavigationRegistry: NavItem[] = [
  { key: 'dashboard', label: 'Painel de controle', tab: 'Painel', route: '/admin', icon: LayoutDashboard, permission: 'AAL2', group: 'Painel' },
  
  // Conteúdo
  { key: 'home_banners', label: 'Home e banners', tab: 'Banners', route: '/admin/home', icon: ImageIcon, permission: 'content.manage', group: 'Conteúdo' },
  { key: 'stories', label: 'Stories', tab: 'Stories', route: '/admin/stories', icon: Clapperboard, permission: 'cases.manage', group: 'Conteúdo' },
  { key: 'cases', label: 'Casos clínicos', tab: 'Casos', route: '/admin/cases', icon: Stethoscope, permission: 'cases.manage', group: 'Conteúdo' },
  { key: 'courses', label: 'Cursos', tab: 'Cursos', route: '/admin/courses', icon: BookOpen, permission: 'courses.manage', group: 'Conteúdo' },
  { key: 'academy', label: 'Academia', route: '/admin/academy', icon: GraduationCap, permission: 'academy.manage', group: 'Conteúdo' },
  
  // Usuários
  { key: 'users', label: 'Usuários', tab: 'Lista de alunos', route: '/admin/users', icon: Users, permission: 'users.manage', group: 'Usuários' },
  { key: 'access', label: 'Acessos', tab: 'Quem tem acesso', route: '/admin/access', icon: Key, permission: 'users.manage', group: 'Usuários' },
  { key: 'products', label: 'Produtos e vendas', tab: 'Produtos', route: '/admin/products', icon: ShoppingBag, permission: 'settings.manage', group: 'Usuários' },
  { key: 'subscriptions', label: 'Assinaturas', tab: 'Assinaturas', route: '/admin/subscriptions', icon: CreditCard, permission: 'users.manage', group: 'Usuários' },
  { key: 'support', label: 'Suporte', tab: 'Chamados', route: '/admin/support', icon: LifeBuoy, permission: 'support.manage', group: 'Usuários' },
  
  // Operação
  { key: 'media', label: 'Biblioteca de mídias', tab: 'Biblioteca de mídias', route: '/admin/media', icon: FolderOpen, permission: 'media.manage', group: 'Operação' },
  { key: 'certificates', label: 'Certificados', tab: 'Certificados', route: '/admin/certificates', icon: Award, permission: 'academy.manage', group: 'Operação' },
  { key: 'communications', label: 'Notificações', tab: 'Avisos', route: '/admin/communications', icon: Bell, permission: 'communications.manage', group: 'Operação' },
  { key: 'reports', label: 'Relatórios', tab: 'Relatórios', route: '/admin/reports', icon: BarChart3, permission: 'reports.read', group: 'Operação' },
  { key: 'monitoring', label: 'Monitoramento', tab: 'Monitoramento', route: '/admin/operations', icon: Activity, permission: 'ops.manage', group: 'Operação' },

  // Governança
  { key: 'settings', label: 'Configurações', tab: 'Áreas do app', route: '/admin/settings', icon: Settings, permission: 'settings.manage', group: 'Governança' },
  { key: 'security', label: 'Segurança', tab: 'Segurança', route: '/admin/security', icon: ShieldCheck, permission: 'settings.manage', group: 'Governança' },
  { key: 'audit', label: 'Auditoria', tab: 'Auditoria', route: '/admin/audit', icon: FileSearch, permission: 'audit.read', group: 'Governança' },
]

export type NavSectionGroup = 'Dia a dia' | 'Conteúdo' | 'Vendas e sistema'

/**
 * Menu enxuto: cada seção agrupa telas relacionadas, que aparecem como abas.
 * Telas fora de qualquer seção (Academia) continuam abrindo pelo endereço.
 */
export interface NavSection {
  key: string
  label: string
  shortLabel: string
  icon: any
  group: NavSectionGroup
  /** Chaves de adminNavigationRegistry, na ordem das abas. */
  items: string[]
}

export const adminNavigationSections: NavSection[] = [
  { key: 'dashboard', label: 'Painel', shortLabel: 'Painel', icon: LayoutDashboard, group: 'Dia a dia', items: ['dashboard'] },
  { key: 'students', label: 'Alunos', shortLabel: 'Alunos', icon: Users, group: 'Dia a dia', items: ['users', 'access'] },
  { key: 'support', label: 'Suporte', shortLabel: 'Suporte', icon: LifeBuoy, group: 'Dia a dia', items: ['support'] },
  { key: 'communications', label: 'Notificações', shortLabel: 'Avisos', icon: Bell, group: 'Dia a dia', items: ['communications'] },
  { key: 'courses', label: 'Cursos e materiais', shortLabel: 'Cursos', icon: BookOpen, group: 'Conteúdo', items: ['courses', 'certificates'] },
  { key: 'cases', label: 'Casos e stories', shortLabel: 'Casos', icon: Stethoscope, group: 'Conteúdo', items: ['cases', 'stories'] },
  { key: 'home', label: 'Home do aluno', shortLabel: 'Home', icon: Home, group: 'Conteúdo', items: ['home_banners', 'media'] },
  { key: 'sales', label: 'Produtos e vendas', shortLabel: 'Vendas', icon: ShoppingBag, group: 'Vendas e sistema', items: ['products', 'subscriptions', 'reports'] },
  { key: 'settings', label: 'Configurações', shortLabel: 'Ajustes', icon: Settings, group: 'Vendas e sistema', items: ['settings', 'security', 'audit', 'monitoring'] },
]

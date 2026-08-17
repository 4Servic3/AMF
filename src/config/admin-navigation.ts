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
  Activity
} from 'lucide-react'

export type NavGroup = 'Painel' | 'Conteúdo' | 'Usuários' | 'Operação' | 'Governança'

export interface NavItem {
  key: string
  label: string
  route: string
  icon: any
  permission: string
  group: NavGroup
}

export const adminNavigationRegistry: NavItem[] = [
  { key: 'dashboard', label: 'Painel de controle', route: '/admin', icon: LayoutDashboard, permission: 'AAL2', group: 'Painel' },
  
  // Conteúdo
  { key: 'home_banners', label: 'Home e banners', route: '/admin/home', icon: ImageIcon, permission: 'content.manage', group: 'Conteúdo' },
  { key: 'stories', label: 'Stories', route: '/admin/stories', icon: Clapperboard, permission: 'content.manage', group: 'Conteúdo' },
  { key: 'cases', label: 'Casos clínicos', route: '/admin/cases', icon: Stethoscope, permission: 'cases.manage', group: 'Conteúdo' },
  { key: 'courses', label: 'Cursos', route: '/admin/courses', icon: BookOpen, permission: 'courses.manage', group: 'Conteúdo' },
  { key: 'academy', label: 'Academia', route: '/admin/academy', icon: GraduationCap, permission: 'academy.manage', group: 'Conteúdo' },
  
  // Usuários
  { key: 'users', label: 'Usuários', route: '/admin/users', icon: Users, permission: 'users.manage', group: 'Usuários' },
  { key: 'access', label: 'Acessos', route: '/admin/access', icon: Key, permission: 'users.manage', group: 'Usuários' },
  { key: 'subscriptions', label: 'Assinaturas', route: '/admin/subscriptions', icon: CreditCard, permission: 'users.manage', group: 'Usuários' },
  { key: 'support', label: 'Suporte', route: '/admin/support', icon: LifeBuoy, permission: 'support.manage', group: 'Usuários' },
  
  // Operação
  { key: 'media', label: 'Biblioteca de mídias', route: '/admin/media', icon: FolderOpen, permission: 'media.manage', group: 'Operação' },
  { key: 'certificates', label: 'Certificados', route: '/admin/certificates', icon: Award, permission: 'academy.manage', group: 'Operação' },
  { key: 'communications', label: 'Notificações', route: '/admin/communications', icon: Bell, permission: 'communications.manage', group: 'Operação' },
  { key: 'reports', label: 'Relatórios', route: '/admin/reports', icon: BarChart3, permission: 'reports.read', group: 'Operação' },
  { key: 'monitoring', label: 'Monitoramento', route: '/admin/operations', icon: Activity, permission: 'ops.manage', group: 'Operação' },

  // Governança
  { key: 'settings', label: 'Configurações', route: '/admin/settings', icon: Settings, permission: 'settings.manage', group: 'Governança' },
  { key: 'security', label: 'Segurança', route: '/admin/security', icon: ShieldCheck, permission: 'settings.manage', group: 'Governança' },
  { key: 'audit', label: 'Auditoria', route: '/admin/audit', icon: FileSearch, permission: 'audit.read', group: 'Governança' },
]

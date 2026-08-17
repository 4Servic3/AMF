import React from 'react';
import Link from 'next/link';
import { hasPermission } from '@/lib/auth/dal';
import { PlusCircle, BookOpen, Layers, MessageSquare, ShieldCheck, FileText } from 'lucide-react';

export default async function Shortcuts() {
  const canManageCases = await hasPermission('cases.manage');
  const canManageCourses = await hasPermission('courses.manage');
  const canManageStories = await hasPermission('stories.manage');
  const canManageCommunications = await hasPermission('communications.manage');
  const canManageUsers = await hasPermission('users.manage');
  const canViewAudit = await hasPermission('audit.view') || await hasPermission('system.manage');

  const links = [
    { href: '/admin/cases', label: 'Novo caso', icon: PlusCircle, permitted: canManageCases },
    { href: '/admin/courses', label: 'Novo curso', icon: BookOpen, permitted: canManageCourses },
    { href: '/admin/stories', label: 'Criar Story', icon: Layers, permitted: canManageStories },
    { href: '/admin/communications', label: 'Enviar aviso', icon: MessageSquare, permitted: canManageCommunications },
    { href: '/admin/users', label: 'Conceder acesso', icon: ShieldCheck, permitted: canManageUsers },
    { href: '/admin/audit', label: 'Ver auditoria', icon: FileText, permitted: canViewAudit },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-[#EBE3D5] shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-[16px] font-serif font-bold text-amf-ink-900">Atalhos administrativos</h3>
      </div>
      <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-3">
        {links.map((link, idx) => {
          const Icon = link.icon;
          if (link.permitted) {
            return (
              <Link key={idx} href={link.href} className="flex items-center gap-3 p-3 bg-amf-surface hover:border-[#0F766E]/50 rounded-lg transition-all border border-[#EBE3D5] hover:shadow-sm outline-none">
                <Icon size={18} strokeWidth={1.5} className="text-[#0F766E] shrink-0" />
                <span className="text-[13px] font-medium text-amf-ink-900">{link.label}</span>
              </Link>
            );
          } else {
            return (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-colors border border-transparent opacity-50 cursor-not-allowed">
                <Icon size={18} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                <span className="text-[13px] font-medium text-gray-500">{link.label}</span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

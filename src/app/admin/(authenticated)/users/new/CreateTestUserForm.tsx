"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMemberTestUser } from "@/app/admin/actions/users";

type Course = { id: string; title: string };
type Created = { email: string; password: string; fullName: string; temporary: boolean; userId: string };

export default function CreateTestUserForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [temporary, setTemporary] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [pending, startTransition] = useTransition();
  function submit(formData: FormData) {
    setError("");
    const fullName = String(formData.get("fullName") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const courseId = String(formData.get("courseId") || "") || null;
    startTransition(async () => {
      const result = await createMemberTestUser({ fullName, email, password, temporary, courseId });
      if (!result.success) { setError(result.error); return; }
      setCreated({ email: result.email, password: result.password, fullName: result.fullName, temporary: result.temporary, userId: result.userId });
      router.refresh();
    });
  }
  if (created) return <section className="amf-panel max-w-2xl space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7c4dbb]">Conta criada</p><h2 className="mt-1 text-xl font-semibold text-amf-ink-900">Credenciais para primeiro acesso</h2></div>
    {created.temporary && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Esta é uma conta sintética de teste. O endereço <strong>.invalid</strong> não recebe e-mails; a conta permanece ativa até ser suspensa ou removida pelo admin.</p>}
    <dl className="grid gap-3 rounded-xl bg-[#f6f5f9] p-4 text-sm"><div><dt className="text-amf-muted-600">Nome</dt><dd className="font-medium">{created.fullName}</dd></div><div><dt className="text-amf-muted-600">E-mail / login</dt><dd className="break-all font-mono">{created.email}</dd></div><div><dt className="text-amf-muted-600">Senha inicial</dt><dd className="break-all font-mono">{created.password}</dd></div></dl>
    <p className="text-sm text-amf-muted-600">Copie e guarde estas credenciais agora. A senha não será exibida novamente.</p>
    <div className="flex flex-wrap gap-3"><button className="amf-primary" onClick={() => void navigator.clipboard.writeText(`Login: ${created.email}\nSenha: ${created.password}`)}>Copiar credenciais</button><Link className="amf-secondary" href={`/admin/users/${created.userId}`}>Abrir perfil</Link><Link className="amf-secondary" href="/admin/users">Voltar para alunos</Link></div>
  </section>;
  return <form action={submit} className="amf-panel max-w-2xl space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7c4dbb]">Acesso de teste</p><h2 className="mt-1 text-xl font-semibold text-amf-ink-900">Dados da conta</h2><p className="mt-1 text-sm text-amf-muted-600">A conta será criada no Supabase Auth e poderá entrar pela tela normal de login.</p></div>
    <label className="flex items-start gap-3 rounded-xl bg-[#f6f5f9] p-4 text-sm"><input type="checkbox" checked={temporary} onChange={event => setTemporary(event.target.checked)} className="mt-1"/><span><strong>Gerar login aleatório de teste</strong><span className="mt-1 block text-amf-muted-600">Cria um e-mail .invalid e senha aleatória, exibidos uma vez ao concluir. A conta não expira automaticamente.</span></span></label>
    {!temporary && <><label className="block text-sm font-medium">Nome completo<input name="fullName" required className="amf-field mt-1 w-full" maxLength={120} autoComplete="name"/></label><label className="block text-sm font-medium">E-mail<input name="email" required type="email" className="amf-field mt-1 w-full" maxLength={254} autoComplete="email"/></label><label className="block text-sm font-medium">Senha inicial <span className="font-normal text-amf-muted-600">(opcional; se vazia, será gerada)</span><input name="password" type="password" minLength={12} maxLength={128} className="amf-field mt-1 w-full" autoComplete="new-password"/><span className="mt-1 block text-xs text-amf-muted-600">Use ao menos 12 caracteres.</span></label></>}
    <label className="block text-sm font-medium">Liberar curso (opcional)<select name="courseId" className="amf-field mt-1 w-full"><option value="">Criar sem acesso a cursos</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={pending} className="amf-primary disabled:opacity-60">{pending ? "Criando conta…" : "Criar usuário"}</button><Link className="amf-secondary" href="/admin/users">Cancelar</Link></div>
  </form>;
}

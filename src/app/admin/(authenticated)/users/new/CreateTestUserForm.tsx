"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMemberTestUser } from "@/app/admin/actions/users";

type Course = { id: string; title: string };
type Product = { id: string; name: string; type: string; description?: string | null };
type Created = { email: string; password: string; fullName: string; temporary: boolean; userId: string };

function AccessOption({ name, value, title, hint }: { name: string; value: string; title: string; hint?: string | null }) {
  return <label className="flex items-start gap-3 rounded-xl bg-[#f6f5f9] px-4 py-3 text-sm has-[:checked]:bg-[var(--admin-tint-soft)]">
    <input type="checkbox" name={name} value={value} className="mt-1" />
    <span><strong className="font-semibold">{title}</strong>{hint && <span className="mt-0.5 block text-amf-muted-600">{hint}</span>}</span>
  </label>;
}

export default function CreateTestUserForm({ courses, products }: { courses: Course[]; products: Product[] }) {
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
    const courseIds = formData.getAll("courseIds").map(String);
    const productIds = formData.getAll("productIds").map(String);
    const expiresAt = String(formData.get("expiresAt") || "") || null;
    startTransition(async () => {
      const result = await createMemberTestUser({ fullName, email, password, temporary, courseIds, productIds, expiresAt });
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
    <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7c4dbb]">Nova conta</p><h2 className="mt-1 text-xl font-semibold text-amf-ink-900">Dados da conta</h2><p className="mt-1 text-sm text-amf-muted-600">A pessoa entra pela tela normal de login do aplicativo.</p></div>
    <label className="flex items-start gap-3 rounded-xl bg-[#f6f5f9] p-4 text-sm"><input type="checkbox" checked={temporary} onChange={event => setTemporary(event.target.checked)} className="mt-1"/><span><strong>Gerar login aleatório de teste</strong><span className="mt-1 block text-amf-muted-600">Cria um e-mail .invalid e senha aleatória, exibidos uma vez ao concluir. A conta não expira automaticamente.</span></span></label>
    {!temporary && <><label className="block text-sm font-medium">Nome completo<input name="fullName" required className="amf-field mt-1 w-full" maxLength={120} autoComplete="name"/></label><label className="block text-sm font-medium">E-mail<input name="email" required type="email" className="amf-field mt-1 w-full" maxLength={254} autoComplete="email"/></label><label className="block text-sm font-medium">Senha inicial <span className="font-normal text-amf-muted-600">(opcional; se vazia, será gerada)</span><input name="password" type="password" minLength={12} maxLength={128} className="amf-field mt-1 w-full" autoComplete="new-password"/><span className="mt-1 block text-xs text-amf-muted-600">Use ao menos 12 caracteres.</span></label></>}
    <div role="group" aria-labelledby="acessos-novos" className="space-y-3 border-t border-[var(--admin-separator)] pt-5">
      <h3 id="acessos-novos" className="text-base font-semibold text-amf-ink-900">O que esta conta pode abrir</h3>
      <p className="text-sm text-amf-muted-600">Marque quantos quiser. Sem nada marcado, a conta entra só com o conteúdo aberto a todos.</p>
      {courses.length > 0 && <div className="space-y-2"><p className="text-[13px] font-semibold uppercase tracking-[.06em] text-[var(--admin-tertiary)]">Cursos</p>{courses.map(course => <AccessOption key={course.id} name="courseIds" value={course.id} title={course.title} />)}</div>}
      {products.length > 0 && <div className="space-y-2"><p className="text-[13px] font-semibold uppercase tracking-[.06em] text-[var(--admin-tertiary)]">Planilha, casos e outros produtos</p>{products.map(product => <AccessOption key={product.id} name="productIds" value={product.id} title={product.name} hint={product.description} />)}</div>}
      <label className="block text-sm font-medium">Acesso válido até <span className="font-normal text-amf-muted-600">(opcional; vazio = sem prazo)</span><input name="expiresAt" type="date" className="amf-field mt-1 block w-full sm:w-60"/></label>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={pending} className="amf-primary disabled:opacity-60">{pending ? "Criando conta…" : "Criar usuário"}</button><Link className="amf-secondary" href="/admin/users">Cancelar</Link></div>
  </form>;
}

import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import { adminDb, queryError } from "@/lib/admin-data";
import CreateTestUserForm from "./CreateTestUserForm";

export default async function NewTestUserPage() {
  const db = await adminDb("users.manage");
  const { data: courses, error } = await db.from("courses").select("id,title").eq("status", "published").order("title");
  queryError(error);
  return <div className="space-y-6">
    <PageHeader title="Criar usuário" description="Cadastre uma conta de teste e libere apenas os cursos necessários." actions={<Link className="amf-secondary" href="/admin/users">Voltar para alunos</Link>} />
    <CreateTestUserForm courses={courses || []} />
  </div>;
}

import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import { adminDb, queryError } from "@/lib/admin-data";
import CreateTestUserForm from "./CreateTestUserForm";

export default async function NewTestUserPage() {
  const db = await adminDb("users.manage");
  const [courses, products] = await Promise.all([
    db.from("courses").select("id,title").eq("status", "published").order("title"),
    db.from("products").select("id,name,type,description").eq("status", "active").neq("type", "course").order("sort_order").order("name"),
  ]);
  queryError(courses.error);
  queryError(products.error);
  return <div className="space-y-6">
    <PageHeader title="Criar usuário" description="Cadastre uma conta e escolha tudo o que ela pode abrir: cursos, planilha e casos." actions={<Link className="amf-secondary" href="/admin/users">Voltar para alunos</Link>} />
    <CreateTestUserForm courses={courses.data || []} products={products.data || []} />
  </div>;
}

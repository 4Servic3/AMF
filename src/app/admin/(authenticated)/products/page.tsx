import { adminDb, queryError } from "@/lib/admin-data";
import PageHeader from "@/components/admin/ui/PageHeader";
import ActionForm from "@/components/admin/ui/ActionForm";
import { createProduct, saveProductSettings } from "@/app/admin/actions/products";
import { centsToPrice } from "@/lib/product-settings-schema";
import { gatewayHref } from "@/lib/commerce/gateway";

export const metadata = { title: "Produtos e vendas | AMF Admin" };

type ProductRow = { id: string; name: string; description: string | null; type: string; status: string; slug: string | null; checkout_url: string | null; unlocks_cases: boolean; product_prices: { amount: number; interval: string | null; active: boolean }[] | null };
type CourseRow = { title: string; product_id: string; status: string };

const TYPE_LABEL: Record<string, string> = { course: "Curso", subscription: "Assinatura", bundle: "Produto avulso", event: "Evento" };
const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "À venda", className: "bg-[#e8f6ee] text-[#1f7a4d]" },
  inactive: { label: "Pausado", className: "bg-amber-50 text-amber-800" },
  draft: { label: "Rascunho", className: "bg-[var(--admin-fill)] text-[var(--admin-secondary)]" },
};

/** Frase curta do que o aluno passa a abrir com o produto. */
function unlocksText(product: ProductRow, course?: CourseRow) {
  const parts = [course ? `o curso ${course.title}` : product.type === "course" ? "o curso ligado a ele" : "o próprio produto"];
  if (product.unlocks_cases) parts.push("todos os stories e casos clínicos");
  return `Libera ${parts.join(" e ")}.`;
}

export default async function ProductsPage() {
  const db = await adminDb("settings.manage");
  const [products, courses] = await Promise.all([
    db.from("products").select("id,name,description,type,status,slug,checkout_url,unlocks_cases,product_prices(amount,interval,active)").order("sort_order").order("name"),
    db.from("courses").select("title,product_id,status").not("product_id", "is", null),
  ]);
  queryError(products.error);
  queryError(courses.error);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Produtos e vendas"
        description="Defina o link de pagamento de cada produto. Todos os botões “Liberar acesso” do aplicativo levam a ele."
      />
      <details className="amf-panel">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span><span className="block text-[17px] font-semibold">Novo produto</span><span className="block text-sm text-[var(--admin-secondary)]">Assinatura, material avulso ou evento. Cursos ganham produto pela tela do curso.</span></span>
          <span className="amf-primary amf-when-closed">Criar produto</span>
        </summary>
        <div className="mt-5 border-t border-[var(--admin-separator)] pt-5">
          <ActionForm action={createProduct} label="Criar produto">
            <label className="block">Nome<input className="mt-2 w-full" name="name" required minLength={3} maxLength={120} placeholder="Ex.: Mentoria AMF" /></label>
            <label className="block">Descrição (aparece na tela de compra)<textarea className="mt-2 w-full" name="description" maxLength={500} rows={2} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">Tipo<select className="mt-2 w-full" name="type" defaultValue="bundle"><option value="bundle">Produto avulso (planilha, material)</option><option value="subscription">Assinatura</option><option value="event">Evento</option></select></label>
              <label className="block">Situação<select className="mt-2 w-full" name="status" defaultValue="draft"><option value="draft">Rascunho (não aparece para alunos)</option><option value="active">À venda</option><option value="inactive">Pausado</option></select></label>
            </div>
            <label className="block">Link de pagamento (checkout)<input className="mt-2 w-full" name="checkoutUrl" type="url" inputMode="url" placeholder="https:// (pode deixar vazio por enquanto)" pattern="https://.+" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">Preço (R$)<input className="mt-2 w-full" name="price" inputMode="decimal" placeholder="197,00" /></label>
              <label className="block">Cobrança<select className="mt-2 w-full" name="interval" defaultValue=""><option value="">Pagamento único</option><option value="month">Mensal</option><option value="year">Anual</option></select></label>
            </div>
            <label className="flex items-center gap-3"><input type="checkbox" name="unlocksCases" className="h-5 w-5" /> Quem tem este produto vê todos os stories e casos</label>
          </ActionForm>
        </div>
      </details>
      {((products.data || []) as ProductRow[]).map((product) => {
        const price = (product.product_prices || []).find((p) => p.active);
        const course = ((courses.data || []) as CourseRow[]).find((c) => c.product_id === product.id);
        return (
          <section key={product.id} className="space-y-4 rounded-3xl border border-[#e6e3ee] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7c4dbb]">{TYPE_LABEL[product.type] || product.type}{course ? ` · ${course.title}` : ""}</p>
                <h2 className="mt-1 text-xl">{product.name}</h2>
                <p className="mt-1 text-sm text-[var(--admin-secondary)]">{unlocksText(product, course)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(STATUS_LABEL[product.status] || STATUS_LABEL.draft).className}`}>{(STATUS_LABEL[product.status] || STATUS_LABEL.draft).label}</span>
              {product.slug && <a className="text-sm font-semibold text-[#7c4dbb] underline" href={gatewayHref({ kind: "product", slug: product.slug }, "home")} target="_blank" rel="noopener noreferrer">Ver tela de compra</a>}
            </div>
            <ActionForm action={saveProductSettings} label="Salvar produto">
              <input type="hidden" name="id" value={product.id} />
              <label className="block">Nome<input className="mt-2 w-full" name="name" defaultValue={product.name} required minLength={3} maxLength={120} /></label>
              <label className="block">Descrição (aparece na tela de compra)<textarea className="mt-2 w-full" name="description" defaultValue={product.description || ""} maxLength={500} rows={2} /></label>
              <label className="block">Link de pagamento (checkout)<input className="mt-2 w-full" name="checkoutUrl" type="url" inputMode="url" placeholder="https://" defaultValue={product.checkout_url || ""} pattern="https://.+" /></label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">Preço (R$)<input className="mt-2 w-full" name="price" inputMode="decimal" placeholder="197,00" defaultValue={centsToPrice(price?.amount)} /></label>
                <label className="block">Cobrança<select className="mt-2 w-full" name="interval" defaultValue={price?.interval || ""}><option value="">Pagamento único</option><option value="month">Mensal</option><option value="year">Anual</option></select></label>
                <label className="block">Situação<select className="mt-2 w-full" name="status" defaultValue={product.status}><option value="active">À venda</option><option value="inactive">Pausado</option><option value="draft">Rascunho</option></select></label>
              </div>
              <label className="flex items-center gap-3"><input type="checkbox" name="unlocksCases" defaultChecked={product.unlocks_cases} className="h-5 w-5" /> Quem tem este produto vê todos os stories e casos</label>
            </ActionForm>
          </section>
        );
      })}
    </div>
  );
}

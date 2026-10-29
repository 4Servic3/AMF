"use server";
import { revalidatePath } from "next/cache";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { parseNewProductForm, parseProductForm, priceToCents, slugify } from "@/lib/product-settings-schema";

/** Salva nome, status, link de pagamento, preço e a regra "libera casos" de um produto. */
export async function saveProductSettings(form: FormData) {
  const session = await requirePermission("settings.manage");
  const db = await adminDb("settings.manage");
  const parsed = parseProductForm(form);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Confira os dados do produto.");
  const p = parsed.data;

  const updated = await db
    .from("products")
    .update({
      name: p.name,
      description: p.description || null,
      status: p.status,
      checkout_url: p.checkoutUrl || null,
      unlocks_cases: p.unlocksCases,
    })
    .eq("id", p.id)
    .select("id");
  queryError(updated.error);
  if (!updated.data?.length) throw new Error("Produto não encontrado.");

  const cents = priceToCents(p.price);
  const current = await db.from("product_prices").select("id,amount,interval").eq("product_id", p.id).eq("active", true);
  queryError(current.error);
  const interval = p.interval || null;
  const unchanged = cents !== null && current.data?.length === 1 && current.data[0].amount === cents && (current.data[0].interval ?? null) === interval;
  if (!unchanged) {
    if (current.data?.length) {
      const off = await db.from("product_prices").update({ active: false }).eq("product_id", p.id).eq("active", true);
      queryError(off.error);
    }
    if (cents !== null) {
      const added = await db.from("product_prices").insert({ product_id: p.id, amount: cents, currency: "BRL", interval, active: true });
      queryError(added.error);
    }
  }

  await writeAdminAuditEvent({
    action: "update_product_settings",
    resourceType: "product",
    resourceId: p.id,
    details: { status: p.status, has_checkout: !!p.checkoutUrl, price_cents: cents, interval, unlocks_cases: p.unlocksCases, actor: session.user.id },
  });
  revalidatePath("/admin/products");
  revalidatePath("/app", "layout");
}

/** Cria um produto novo (assinatura, avulso ou evento) com preço opcional. */
export async function createProduct(form: FormData) {
  const session = await requirePermission("settings.manage");
  const db = await adminDb("settings.manage");
  const parsed = parseNewProductForm(form);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Confira os dados do produto.");
  const p = parsed.data;
  const base = slugify(p.name);
  if (!base) throw new Error("Use letras ou números no nome do produto.");

  const existing = await db.from("products").select("slug,sort_order").order("sort_order", { ascending: false });
  queryError(existing.error);
  const taken = new Set((existing.data || []).map((row: { slug: string | null }) => row.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  const sortOrder = ((existing.data?.[0] as { sort_order?: number } | undefined)?.sort_order ?? 0) + 10;

  const created = await db
    .from("products")
    .insert({
      name: p.name,
      description: p.description || null,
      type: p.type,
      status: p.status,
      checkout_url: p.checkoutUrl || null,
      unlocks_cases: p.unlocksCases,
      slug,
      sort_order: sortOrder,
      is_free: false,
      featured: false,
    })
    .select("id")
    .single();
  queryError(created.error);

  const cents = priceToCents(p.price);
  if (cents !== null) {
    const added = await db.from("product_prices").insert({ product_id: created.data.id, amount: cents, currency: "BRL", interval: p.interval || null, active: true });
    queryError(added.error);
  }

  await writeAdminAuditEvent({
    action: "create_product",
    resourceType: "product",
    resourceId: created.data.id,
    details: { type: p.type, status: p.status, slug, price_cents: cents, unlocks_cases: p.unlocksCases, actor: session.user.id },
  });
  revalidatePath("/admin/products");
  revalidatePath("/app", "layout");
}

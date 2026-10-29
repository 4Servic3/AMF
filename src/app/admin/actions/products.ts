"use server";
import { revalidatePath } from "next/cache";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { parseProductForm, priceToCents } from "@/lib/product-settings-schema";

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

"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAdminAuditEvent } from "@/lib/auth/dal";
export async function saveAcademyPath(id: string | null, input: unknown) {
  const db = await adminDb("academy.manage");
  const data = z
    .object({
      title: z.string().trim().min(1).max(160),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string().max(10000),
      status: z.enum(["draft", "published", "archived"]),
      estimated_weeks: z.coerce.number().int().min(1).max(104),
    })
    .parse(input);
  const query =
    id && id !== "new"
      ? db.from("academy_paths").update(data).eq("id", z.uuid().parse(id))
      : db.from("academy_paths").insert(data);
  const result = await query.select("id").single();
  queryError(result.error);
  await writeAdminAuditEvent({
    action: "save_academy",
    resourceType: "academy_path",
    resourceId: result.data.id,
  });
  revalidatePath("/admin/academy");
  revalidatePath("/admin/academy/editor/" + result.data.id);
  return { success: true, id: result.data.id };
}
export async function savePhase(id: string | null, input: unknown) {
  const db = await adminDb("academy.manage");
  const data = z
    .object({
      path_id: z.uuid(),
      title: z.string().trim().min(1).max(160),
      position: z.coerce.number().int().min(0),
    })
    .parse(input);
  const query = id
    ? db
        .from("academy_phases")
        .update(data)
        .eq("id", z.uuid().parse(id))
        .eq("path_id", data.path_id)
    : db.from("academy_phases").insert(data);
  const { error } = await query.select("id").single();
  queryError(error);
  revalidatePath("/admin/academy/editor/" + data.path_id);
  return { success: true };
}
export async function saveStep(id: string | null, input: unknown) {
  const db = await adminDb("academy.manage");
  const data = z
    .object({
      phase_id: z.uuid(),
      position: z.coerce.number().int().min(0),
      step_type: z.enum(["course", "case"]),
      target_id: z.uuid(),
      title_override: z.string().max(160),
      status: z.enum(["published", "archived"]),
    })
    .parse(input);
  const target = await db
    .from(data.step_type === "course" ? "courses" : "cases")
    .select("id")
    .eq("id", data.target_id)
    .single();
  queryError(target.error);
  const query = id
    ? db
        .from("academy_steps")
        .update(data)
        .eq("id", z.uuid().parse(id))
        .eq("phase_id", data.phase_id)
    : db.from("academy_steps").insert(data);
  const { error } = await query.select("id").single();
  queryError(error);
  revalidatePath("/admin/academy", "layout");
  return { success: true };
}
export async function savePrerequisite(input: unknown) {
  const db = await adminDb("academy.manage");
  const data = z
    .object({ step_id: z.uuid(), prerequisite_step_id: z.uuid() })
    .parse(input);
  if (data.step_id === data.prerequisite_step_id)
    throw new Error("Uma etapa não pode depender dela mesma.");
  const { data: steps, error } = await db
    .from("academy_steps")
    .select("id,position,phase:academy_phases(path_id,position)")
    .in("id", [data.step_id, data.prerequisite_step_id]);
  queryError(error);
  const step = steps.find((s: any) => s.id === data.step_id),
    pre = steps.find((s: any) => s.id === data.prerequisite_step_id);
  if (
    !step ||
    !pre ||
    step.phase.path_id !== pre.phase.path_id ||
    !(
      pre.phase.position < step.phase.position ||
      (pre.phase.position === step.phase.position &&
        pre.position < step.position)
    )
  )
    throw new Error("Escolha uma etapa anterior da mesma trilha.");
  const result = await db
    .from("academy_prerequisites")
    .upsert(data, { onConflict: "step_id,prerequisite_step_id" });
  queryError(result.error);
  revalidatePath("/admin/academy", "layout");
  return { success: true };
}

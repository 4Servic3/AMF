import { NextRequest, NextResponse } from "next/server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
export async function POST(request: NextRequest) {
  const session = await requirePermission("media.manage");
  const db = await adminDb("media.manage");
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > 10 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "Selecione JPG, PNG, WebP ou PDF de até 10 MB." },
        { status: 400 },
      );
    const types: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
    };
    if (!types[file.type])
      return NextResponse.json(
        { error: "Formato não permitido." },
        { status: 400 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const magic =
      file.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216
        : file.type === "image/png"
          ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
          : file.type === "image/webp"
            ? Buffer.from(bytes.slice(0, 4)).toString() === "RIFF" &&
              Buffer.from(bytes.slice(8, 12)).toString() === "WEBP"
            : Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-";
    if (!magic)
      return NextResponse.json(
        { error: "O arquivo não corresponde ao formato informado." },
        { status: 400 },
      );
    const bucket = "amf_admin_library",
      filePath =
        session.user.id + "/" + crypto.randomUUID() + "." + types[file.type];
    const upload = await db.storage
      .from(bucket)
      .upload(filePath, bytes, { contentType: file.type, upsert: false });
    queryError(upload.error);
    const asset = await db
      .from("media_assets")
      .insert({
        file_name: file.name.slice(0, 200),
        file_path: filePath,
        content_type: file.type,
        size_bytes: file.size,
        bucket,
        visibility: "admin",
        created_by: session.user.id,
      })
      .select("id")
      .single();
    if (asset.error) {
      await db.storage.from(bucket).remove([filePath]);
      queryError(asset.error);
    }
    await writeAdminAuditEvent({
      action: "upload_media",
      resourceType: "media",
      resourceId: asset.data.id,
    });
    return NextResponse.json({ id: asset.data.id });
  } catch (error) {
    console.error("Media upload failed", error);
    return NextResponse.json(
      { error: "Falha ao enviar arquivo. Tente novamente." },
      { status: 500 },
    );
  }
}

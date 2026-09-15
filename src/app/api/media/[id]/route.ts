import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { hasPermission } from "@/lib/auth/dal";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return new NextResponse(null, { status: 404 });
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const db = createServiceRoleClient();
  const { data: asset } = await db
    .from("media_assets")
    .select("bucket,file_path")
    .eq("id", id)
    .maybeSingle();
  if (!asset?.bucket) return new NextResponse(null, { status: 404 });
  const { data: aal } = await auth.auth.mfa.getAuthenticatorAssuranceLevel();
  const admin =
    aal?.currentLevel === "aal2" &&
    ((await hasPermission("media.manage")) ||
      (await hasPermission("content.manage")));
  if (!admin) {
    const { data: banner } = await db
      .from("home_banners")
      .select("id")
      .eq("media_asset_id", id)
      .eq("status", "published")
      .limit(1);
    if (!banner?.length) return new NextResponse(null, { status: 403 });
  }
  const { data, error } = await db.storage
    .from(asset.bucket)
    .createSignedUrl(asset.file_path, 60);
  if (error || !data) return new NextResponse(null, { status: 503 });
  return NextResponse.redirect(data.signedUrl, {
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

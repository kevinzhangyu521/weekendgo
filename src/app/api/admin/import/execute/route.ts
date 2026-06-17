import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { executeImport, parseAndValidateCsv } from "@/features/importer/service";
import { getRequestAuth } from "@/lib/auth/request-auth";

export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "请先登录管理员账号。" }, { status: 401 });

  const { data: adminUser, error: adminError } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminError || !adminUser) return NextResponse.json({ error: "当前账号没有管理员权限。" }, { status: 403 });

  const formData = await request.formData();
  const spotsFile = formData.get("spots");
  const facilitiesFile = formData.get("facilities");
  const photosFile = formData.get("photos");

  if (!(spotsFile instanceof File) || !(facilitiesFile instanceof File) || !(photosFile instanceof File)) {
    return NextResponse.json({ error: "\u8bf7\u4e0a\u4f20 spots\u3001facilities \u548c photos \u4e09\u4e2a CSV \u6587\u4ef6\u3002" }, { status: 400 });
  }

  const spotsRaw = await spotsFile.text();
  const facilitiesRaw = await facilitiesFile.text();
  const photosRaw = await photosFile.text();
  const parsed = parseAndValidateCsv(spotsRaw, facilitiesRaw, photosRaw);
  if (!parsed.result.ok) return NextResponse.json(parsed.result, { status: 400 });

  const result = await executeImport(parsed.rows.spots, parsed.rows.facilities, parsed.rows.photos);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidateTag("destinations");
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeImport, parseAndValidateCsv } from "@/features/importer/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "\u8bf7\u5148\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\u3002" }, { status: 401 });

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
  return NextResponse.json(result);
}

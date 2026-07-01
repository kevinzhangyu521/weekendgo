import { NextResponse } from "next/server";
import { parseAndValidateCsv } from "@/features/importer/service";
import { getRequestAuth } from "@/lib/auth/request-auth";

export async function POST(request: Request) {
  const { user, isAdmin } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "\u8bf7\u5148\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "\u5f53\u524d\u8d26\u53f7\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

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

  const { result } = parseAndValidateCsv(spotsRaw, facilitiesRaw, photosRaw);
  return NextResponse.json(result);
}

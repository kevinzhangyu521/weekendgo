const baseUrl = process.argv[2] ?? "https://www.qimeide.com";
const path = "/destinations/wuhan-picnic-east-lake-greenway";
const response = await fetch(`${baseUrl}${path}?destination2-check=${Date.now()}`, {
  redirect: "follow",
  headers: { "accept-language": "zh-CN,zh;q=0.9" }
});
const html = await response.text();
const hasNotFoundDigest = html.includes("NEXT_HTTP_ERROR_FALLBACK;404");
const hasDecisionSection = html.includes("出发前先看") || html.includes("Check before leaving");

if (!response.ok || hasNotFoundDigest || !hasDecisionSection) {
  console.error(JSON.stringify({
    ok: false,
    status: response.status,
    hasNotFoundDigest,
    hasDecisionSection
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  status: response.status,
  hasNotFoundDigest,
  hasDecisionSection
}, null, 2));

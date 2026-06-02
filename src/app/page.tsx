import Link from "next/link";
import { Bath, Car, Footprints, Sandwich, ShieldCheck, Star, Tent, Waves } from "lucide-react";
import { getLocale, pick } from "@/lib/i18n/server";

type Destination = {
  id: string;
  title: string;
  titleZh: string;
  scene: "Camping" | "Creek" | "Hiking" | "Picnic";
  distance: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  safety: "Low Risk" | "Medium Risk";
  tags: string[];
  tagsZh: string[];
  image: string;
};

const scenes = [
  { key: "camping", label: "Camping", labelZh: "\u9732\u8425", icon: Tent, color: "bg-amber-100 text-amber-700" },
  { key: "creek", label: "Creek", labelZh: "\u6eaf\u6eaa", icon: Waves, color: "bg-sky-100 text-sky-700" },
  { key: "hiking", label: "Hiking", labelZh: "\u5f92\u6b65", icon: Footprints, color: "bg-orange-100 text-orange-700" },
  { key: "picnic", label: "Picnic", labelZh: "\u91ce\u9910", icon: Sandwich, color: "bg-pink-100 text-pink-700" }
] as const;

const recommendations: Destination[] = [
  {
    id: "d1",
    title: "Qingxi Family Creek",
    titleZh: "\u6e05\u6eaa\u8c37\u4eb2\u5b50\u6eaf\u6eaa",
    scene: "Creek",
    distance: "42km",
    difficulty: "Easy",
    safety: "Low Risk",
    tags: ["3+ years", "Parking", "Toilet"],
    tagsZh: ["3\u5c81+\u53cb\u597d", "\u53ef\u505c\u8f66", "\u6709\u6d17\u624b\u95f4"],
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "d2",
    title: "Pine Lake Campground",
    titleZh: "\u677e\u6797\u6e56\u7554\u8425\u5730",
    scene: "Camping",
    distance: "68km",
    difficulty: "Easy",
    safety: "Low Risk",
    tags: ["Overnight", "Campfire", "Beginner Friendly"],
    tagsZh: ["\u53ef\u8fc7\u591c", "\u53ef\u8425\u706b", "\u65b0\u624b\u53cb\u597d"],
    image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "d3",
    title: "Yunlan Light Trail Loop",
    titleZh: "\u4e91\u5c9a\u5c71\u8f7b\u5f92\u6b65\u73af\u7ebf",
    scene: "Hiking",
    distance: "36km",
    difficulty: "Moderate",
    safety: "Medium Risk",
    tags: ["6+ years", "Shaded", "2-hour loop"],
    tagsZh: ["6\u5c81+\u53cb\u597d", "\u6709\u6811\u836b", "2\u5c0f\u65f6\u73af\u7ebf"],
    image: "https://images.unsplash.com/photo-1464822759844-d150ad6d1d88?auto=format&fit=crop&w=1400&q=80"
  }
];

function pickSceneZh(scene: Destination["scene"]) {
  return scene === "Camping" ? "\u9732\u8425" : scene === "Creek" ? "\u6eaf\u6eaa" : scene === "Hiking" ? "\u5f92\u6b65" : "\u91ce\u9910";
}

function pickDifficultyZh(difficulty: Destination["difficulty"]) {
  return difficulty === "Easy" ? "\u8f7b\u677e" : difficulty === "Moderate" ? "\u9002\u4e2d" : "\u8fdb\u9636";
}

function pickSafetyZh(safety: Destination["safety"]) {
  return safety === "Low Risk" ? "\u4f4e\u98ce\u9669" : "\u4e2d\u98ce\u9669";
}

function SceneBadge({ scene, zh }: { scene: Destination["scene"]; zh: boolean }) {
  const colorMap: Record<Destination["scene"], string> = {
    Camping: "bg-amber-100 text-amber-700",
    Creek: "bg-sky-100 text-sky-700",
    Hiking: "bg-orange-100 text-orange-700",
    Picnic: "bg-pink-100 text-pink-700"
  };
  const name = zh ? pickSceneZh(scene) : scene;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[scene]}`}>{name}</span>;
}

export default async function HomePage() {
  const locale = await getLocale();
  const zh = locale === "zh";

  return (
    <main className="min-h-screen">
      <section className="mx-auto mt-4 max-w-6xl px-4 md:px-6">
        <div
          className="relative overflow-hidden rounded-2xl bg-cover bg-center p-6 md:p-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,.45), rgba(15,23,42,.35)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80')"
          }}
        >
          <p className="text-sm text-emerald-100">{pick(locale, "This Weekend", "\u672c\u5468\u672b\u63a8\u8350")}</p>
          <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight text-white md:text-4xl">
            {pick(locale, "Find safe outdoor picks for your family in under 2 hours", "2\u5c0f\u65f6\u5185\u627e\u5230\u9002\u5408\u4eb2\u5b50\u5bb6\u5ead\u7684\u5b89\u5fc3\u6237\u5916\u76ee\u7684\u5730")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-100 md:text-base">
            {pick(locale, "Curated by family needs: easier routes, practical facilities, and lower risk options.", "\u5df2\u6309\u4eb2\u5b50\u9700\u6c42\u7b5b\u9009\uff1a\u4f4e\u96be\u5ea6\u3001\u8bbe\u65bd\u5b8c\u5584\u3001\u98ce\u9669\u53ef\u63a7\u3002")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{pick(locale, "Sunny 25C", "\u6674 25\u00b0C")}</span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{pick(locale, "Wind Level 2", "\u98ce\u529b 2\u7ea7")}</span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{pick(locale, "Good for outdoors", "\u9002\u5408\u6237\u5916")}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {scenes.map((item) => (
            <Link
              key={item.key}
              href={`/destinations?scenario=${item.key}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-base font-semibold text-slate-900">{zh ? item.labelZh : item.label}</p>
              <p className="text-xs text-slate-500">{pick(locale, "Family popular", "\u4eb2\u5b50\u70ed\u95e8")}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 pb-10 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{pick(locale, "Recommended For You", "\u4e3a\u4f60\u63a8\u8350")}</h2>
          <Link href="/destinations" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            {pick(locale, "View all", "\u67e5\u770b\u5168\u90e8")}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="h-44 w-full bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <SceneBadge scene={item.scene} zh={zh} />
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    4.8
                  </span>
                </div>

                <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{zh ? item.titleZh : item.title}</h3>

                <p className="text-sm text-slate-600">
                  {item.distance} - {zh ? pickDifficultyZh(item.difficulty) : item.difficulty} - {zh ? pickSafetyZh(item.safety) : item.safety}
                </p>

                <div className="flex flex-wrap gap-2">
                  {(zh ? item.tagsZh : item.tags).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {pick(locale, "Safety notes", "\u5b89\u5168\u63d0\u793a")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {pick(locale, "Parking", "\u505c\u8f66")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {pick(locale, "Toilet", "\u6d17\u624b\u95f4")}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

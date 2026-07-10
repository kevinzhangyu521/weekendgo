import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Bath, Car, ChevronLeft, Clock, MapPinned, ShieldCheck, Star, Users } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { DestinationFeedbackButton } from "@/components/feedback/destination-feedback-button";
import { AuthActionHint } from "@/components/auth/auth-action-hint";
import { DestinationImage } from "@/components/destinations/destination-image";
import { AddToPlanButton } from "@/components/plans/add-to-plan-button";
import { AmapNavigationButton } from "@/components/plans/amap-navigation-button";
import { ReviewForm } from "@/components/reviews/review-form";
import { DestinationViewTracker } from "@/components/destinations/destination-view-tracker";
import { getDestinationImage } from "@/features/destinations/images";
import {
  destinationName,
  destinationRegion,
  destinationScenario
} from "@/features/destinations/presenter";
import { getAllDestinations, getDestinationById, getDestinationPhotos } from "@/features/destinations/repository";
import type { DestinationItem, DestinationPhoto } from "@/features/destinations/types";
import { getMyProfile } from "@/features/profiles/repository";
import { getDestinationReviewsForUser } from "@/features/reviews/repository";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getLocale, pick } from "@/lib/i18n/server";

function formatDistance(distanceKm: number, locale: "en" | "zh") {
  if (!distanceKm || distanceKm <= 0) return "--";
  return pick(locale, `About ${distanceKm}km away`, `约 ${distanceKm}km`);
}

function valueOrEmpty(value?: string | null) {
  return value?.trim() || "--";
}

function ageDecision(item: DestinationItem, locale: "en" | "zh") {
  const min = item.suitableAgeMin;
  const max = item.suitableAgeMax;
  if (typeof min === "number" && typeof max === "number" && max > min) {
    return locale === "zh" ? `${min}-${max}岁` : `${min}-${max} years`;
  }
  if (typeof min === "number" && min >= 0) return locale === "zh" ? `${min}岁+` : `${min}+ years`;
  return "--";
}

function booleanLabel(value: boolean | null | undefined, locale: "en" | "zh", yesZh: string, noZh: string, yesEn: string, noEn: string) {
  if (typeof value !== "boolean") return "--";
  return value ? pick(locale, yesEn, yesZh) : pick(locale, noEn, noZh);
}

function reservationLabel(item: DestinationItem, locale: "en" | "zh") {
  return item.reservationRequired ? pick(locale, "Reservation required", "需要预约") : pick(locale, "No reservation needed", "无需预约");
}

function reviewAgeLabel(value: string | null, locale: "en" | "zh") {
  if (!value) return null;
  const labels: Record<string, { en: string; zh: string }> = {
    "0-3": { en: "Age 0-3", zh: "适合0-3岁" },
    "3-6": { en: "Age 3-6", zh: "适合3-6岁" },
    "6-12": { en: "Age 6-12", zh: "适合6-12岁" },
    "12+": { en: "Age 12+", zh: "适合12岁+" }
  };
  return pick(locale, labels[value]?.en ?? value, labels[value]?.zh ?? value);
}

function reviewParkingLabel(value: string | null, locale: "en" | "zh") {
  if (!value) return null;
  const labels: Record<string, { en: string; zh: string }> = {
    easy: { en: "Easy parking", zh: "停车方便" },
    normal: { en: "Parking is okay", zh: "停车一般" },
    hard: { en: "Hard to park", zh: "停车较难" }
  };
  return pick(locale, labels[value]?.en ?? value, labels[value]?.zh ?? value);
}

function reviewToiletLabel(value: string | null, locale: "en" | "zh") {
  if (!value) return null;
  const labels: Record<string, { en: string; zh: string }> = {
    good: { en: "Toilet convenient", zh: "厕所方便" },
    normal: { en: "Toilet is okay", zh: "厕所一般" },
    poor: { en: "Few toilets", zh: "厕所较少" }
  };
  return pick(locale, labels[value]?.en ?? value, labels[value]?.zh ?? value);
}

function formatReviewDateTime(value: string, locale: "en" | "zh") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formatted = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  return formatted.replace(/\//g, "-");
}

function photoGallery(photos: DestinationPhoto[] | null | undefined, fallback: { src: string; pending: boolean }, name: string): DestinationPhoto[] {
  if (Array.isArray(photos) && photos.length > 0) return photos;
  if (fallback.pending || !fallback.src) return [];
  return [
    {
      id: "legacy-cover",
      destinationId: "",
      imageUrl: fallback.src,
      category: "cover",
      altText: name,
      isCover: true,
      sortOrder: 0
    }
  ];
}

function DecisionTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}

export default async function DestinationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  const [user, profile, destinationRaw, allDestinationsRaw] = await Promise.all([
    getCurrentUser(),
    getMyProfile(),
    getDestinationById(id),
    getAllDestinations()
  ]);
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;

  if (!destinationRaw) notFound();

  const [destination] = withDistanceFromCity([destinationRaw], homeCity);
  const name = destinationName(destination, locale);
  const heroImage = getDestinationImage(destination);
  const [photos, reviewResult] = await Promise.all([
    getDestinationPhotos(destination.id),
    getDestinationReviewsForUser(destination.id, user?.id)
  ]);
  const gallery = photoGallery(photos, heroImage, name);
  const related = withDistanceFromCity(
    allDestinationsRaw
      .filter((item) => item.id !== destination.id && (item.scenario === destination.scenario || item.city === destination.city))
      .slice(0, 3),
    homeCity
  );
  const loginHref = `/login?next=${encodeURIComponent(`/destinations/${id}`)}`;
  const decisionItems = [
    { label: pick(locale, "Suitable age", "适合年龄"), value: ageDecision(destination, locale) },
    { label: pick(locale, "Suggested duration", "建议游玩时长"), value: valueOrEmpty(destination.suggestedDuration) },
    { label: pick(locale, "Family budget", "一家三口预算"), value: valueOrEmpty(destination.familyBudget) },
    { label: pick(locale, "Reservation", "是否需要预约"), value: reservationLabel(destination, locale) },
    { label: pick(locale, "Best time", "最佳游玩时间"), value: valueOrEmpty(destination.bestTime) },
    { label: pick(locale, "Parking", "停车详情"), value: valueOrEmpty(destination.parkingDetail) },
    { label: pick(locale, "Toilet", "卫生间详情"), value: valueOrEmpty(destination.toiletDetail) },
    {
      label: pick(locale, "Stroller friendly", "婴儿车友好"),
      value: booleanLabel(destination.strollerFriendly, locale, "友好", "不确定", "Friendly", "Unknown")
    },
    {
      label: pick(locale, "Pet friendly", "宠物友好"),
      value: booleanLabel(destination.petFriendly, locale, "友好", "不确定", "Friendly", "Unknown")
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <DestinationViewTracker destinationId={destination.id} />
      <section className="qmd-container py-6">
        <Link href="/destinations" className="interactive-text-link mb-4 inline-flex items-center gap-1 text-sm text-slate-600">
          <ChevronLeft className="h-4 w-4" />
          {pick(locale, "Back to destinations", "返回目的地列表")}
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[280px] overflow-hidden bg-slate-100 md:min-h-[420px]">
              <DestinationImage
                src={heroImage.src}
                alt={name}
                fetchPriority="high"
                decoding="async"
                className="interactive-image h-full w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                {destinationScenario(destination, locale)}
              </span>
            </div>
            <div className="flex flex-col gap-5 p-5 md:p-7">
              <div>
                <p className="text-sm font-bold text-emerald-700">{pick(locale, "Worth going today?", "今天值不值得去？")}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 md:text-4xl">{name}</h1>
                <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold leading-7 text-emerald-900">
                  {valueOrEmpty(destination.editorRecommendation)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                <DecisionTile label={pick(locale, "Region", "城市/地区")} value={destinationRegion(destination, locale) || "--"} />
                <DecisionTile label={pick(locale, "Distance", "距离")} value={formatDistance(destination.distanceKm, locale)} />
                <DecisionTile label={pick(locale, "Age", "适合年龄")} value={ageDecision(destination, locale)} />
                <DecisionTile label={pick(locale, "Duration", "游玩时长")} value={valueOrEmpty(destination.suggestedDuration)} />
                <DecisionTile label={pick(locale, "Budget", "预算")} value={valueOrEmpty(destination.familyBudget)} />
              </div>

              <div className="mt-auto grid gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <AmapNavigationButton
                    destination={destination}
                    label={pick(locale, "Navigate", "立即导航")}
                    className="h-11"
                    isSignedIn={Boolean(user)}
                    loginHref={loginHref}
                    signedOutLabel={pick(locale, "Sign in to navigate", "登录后导航")}
                  />
                  <FavoriteButton destinationId={destination.id} initialIsLoggedIn={Boolean(user)} />
                  <AddToPlanButton destinationId={destination.id} locale={locale} />
                </div>
                <AuthActionHint text={pick(locale, "Sign in to save destinations and add them to your weekend plan.", "登录后可收藏地点、加入周末计划")} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{pick(locale, "Check before leaving", "出发前先看")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {decisionItems.map((item) => (
              <DecisionTile key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{pick(locale, "Photos", "图片")}</h2>
          {gallery.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {gallery.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <DestinationImage
                      src={photo.imageUrl}
                      alt={photo.altText || name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-600">
                    <span className="rounded-full bg-white px-2 py-1 font-semibold">{photo.category}</span>
                    {photo.isCover ? <span className="font-semibold text-emerald-700">{pick(locale, "Cover", "封面")}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{pick(locale, "No photos yet", "暂无图片")}</p>
          )}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-emerald-950">
              <Users className="h-5 w-5" />
              {pick(locale, "Family tips", "带娃提醒")}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-emerald-900">
              {destination.familyTips?.trim() || pick(locale, "No family tips yet", "暂无带娃提醒")}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-amber-950">
              <AlertTriangle className="h-5 w-5" />
              {pick(locale, "Avoid pitfalls", "避坑提醒")}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-amber-900">
              {destination.avoidPitfalls?.trim() || pick(locale, "No pitfalls yet", "暂无避坑提醒")}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{pick(locale, "Map and navigation", "地图与导航")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <DecisionTile label={pick(locale, "Address", "地址")} value={valueOrEmpty(destination.address)} />
              <DecisionTile label={pick(locale, "Coordinates", "经纬度")} value={`${destination.latitude || "--"}, ${destination.longitude || "--"}`} />
              <DecisionTile label={pick(locale, "Distance", "距离")} value={formatDistance(destination.distanceKm, locale)} />
            </div>
            <AmapNavigationButton
              destination={destination}
              label={pick(locale, "Navigate", "立即导航")}
              className="h-11"
              isSignedIn={Boolean(user)}
              loginHref={loginHref}
              signedOutLabel={pick(locale, "Sign in to navigate", "登录后导航")}
            />
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 text-xl font-black text-slate-950">{pick(locale, "Related picks", "相关推荐")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((item) => {
              const image = getDestinationImage(item);
              return (
                <Link
                  key={item.id}
                  href={`/destinations/${item.id}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-100">
                    <DestinationImage
                      src={image.src}
                      alt={destinationName(item, locale)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900">{destinationName(item, locale)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {destinationRegion(item, locale)} - {formatDistance(item.distanceKm, locale)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="reviews" className="mt-5 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-950">{pick(locale, "Real family experiences", "真实亲子体验")}</h2>
              <p className="mt-1 text-sm text-slate-600">{pick(locale, "Short notes from families who have been there.", "来自用户的真实游玩反馈，帮助别的家庭少踩坑。")}</p>
            </div>
            <DestinationFeedbackButton destinationName={name} />
          </div>

          <ReviewForm destinationId={destination.id} initialReview={reviewResult.myReview} isSignedIn={Boolean(user)} />

          <div className="mt-4 space-y-3">
            {reviewResult.reviews.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {pick(locale, "No real experiences yet. Be the first family to share.", "暂无真实体验，你可以成为第一个分享的家庭。")}
              </div>
            ) : (
              reviewResult.reviews.map((review) => {
                const tags = [
                  reviewAgeLabel(review.suitableAge, locale),
                  reviewParkingLabel(review.parkingRating, locale),
                  reviewToiletLabel(review.toiletRating, locale),
                  review.recommend === true ? pick(locale, "Would go again", "推荐再去") : review.recommend === false ? pick(locale, "Would not rush back", "不太推荐") : null
                ].filter(Boolean);

                return (
                  <article key={review.id} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="inline-flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-slate-300"}`} />
                          ))}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {review.isMine ? pick(locale, "Me", "我") : review.userName || pick(locale, "Nickname not set", "未设置昵称")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
                        {review.isMine ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">{"我的体验"}</span> : null}
                        <span>{formatReviewDateTime(review.createdAt, locale)}</span>
                      </div>
                    </div>
                    {tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {review.safetyNote ? (
                      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                        <span className="font-semibold">{pick(locale, "Safety note: ", "安全提醒：")}</span>
                        {review.safetyNote}
                      </p>
                    ) : null}
                    <p className="mt-3 leading-6">{review.content}</p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="qmd-container flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{formatDistance(destination.distanceKm, locale)}</p>
          </div>
          <AmapNavigationButton
            destination={destination}
            label={pick(locale, "Navigate", "立即导航")}
            className="h-11 shrink-0"
            isSignedIn={Boolean(user)}
            loginHref={loginHref}
            signedOutLabel={pick(locale, "Sign in to navigate", "登录后导航")}
          />
        </div>
      </div>
    </main>
  );
}

